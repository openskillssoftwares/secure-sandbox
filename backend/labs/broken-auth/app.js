const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const speakeasy = require('speakeasy');
const crypto = require('crypto');

const app = express();
const db = new Database('users.db');
const SECRET_KEY = 'weak_secret_key_12345'; // Vulnerable: Weak secret
const WEAK_JWT_SECRET = 'abc123'; // Vulnerable: Very weak JWT secret

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// EASY: Weak password brute force
app.post('/api/login/easy', (req, res) => {
  const { username, password } = req.body;
  
  // Vulnerable: No rate limiting, weak passwords
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  
  if (user) {
    // Vulnerable: Predictable session tokens
    const sessionToken = Buffer.from(username + ':' + Date.now()).toString('base64');
    db.prepare('INSERT OR REPLACE INTO sessions VALUES (?, ?, ?)').run(sessionToken, user.id, Date.now() + 3600000);
    
    res.json({ 
      success: true, 
      token: sessionToken, 
      user: { id: user.id, username: user.username, role: user.role },
      flag: user.role === 'superadmin' ? user.password : null
    });
  } else {
    // Vulnerable: Username enumeration
    const userExists = db.prepare('SELECT username FROM users WHERE username = ?').get(username);
    res.status(401).json({ 
      success: false, 
      error: userExists ? 'Invalid password' : 'User not found' 
    });
  }
});

// MEDIUM: Session hijacking vulnerability
app.post('/api/login/medium', (req, res) => {
  const { username, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  
  if (user) {
    // Vulnerable: Sequential session IDs
    const sessionId = 1000 + Math.floor(Math.random() * 100); // Predictable range
    const sessionToken = `SESSION_${sessionId}`;
    
    db.prepare('INSERT OR REPLACE INTO sessions VALUES (?, ?, ?)').run(sessionToken, user.id, Date.now() + 3600000);
    
    res.cookie('session_id', sessionToken, { httpOnly: false }); // Vulnerable: Not httpOnly
    res.json({ success: true, sessionId });
  } else {
    res.status(401).json({ success: false });
  }
});

// Check session and get flag
app.get('/api/session/check', (req, res) => {
  const sessionToken = req.cookies.session_id || req.headers['x-session-token'];
  
  if (!sessionToken) {
    return res.status(401).json({ error: 'No session' });
  }
  
  const session = db.prepare('SELECT * FROM sessions WHERE token = ? AND expires > ?').get(sessionToken, Date.now());
  
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id);
  const secret = db.prepare('SELECT flag FROM secrets WHERE difficulty = "medium"').get();
  
  res.json({ 
    user: { id: user.id, username: user.username, role: user.role },
    flag: user.role === 'admin' ? secret.flag : null
  });
});

// HARD: JWT forgery vulnerability
app.post('/api/login/hard', (req, res) => {
  const { username, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  
  if (user) {
    // Vulnerable: Weak JWT secret + algorithm confusion
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      WEAK_JWT_SECRET,
      { algorithm: 'HS256' } // Vulnerable to algorithm confusion attack
    );
    
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false });
  }
});

// Verify JWT and get flag
app.get('/api/jwt/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }
  
  try {
    // Vulnerable: Accepts 'none' algorithm
    const decoded = jwt.verify(token, WEAK_JWT_SECRET, { algorithms: ['HS256', 'none'] });
    
    const secret = db.prepare('SELECT flag FROM secrets WHERE difficulty = "hard"').get();
    
    res.json({ 
      user: decoded,
      flag: decoded.role === 'admin' ? secret.flag : null
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// IMPOSSIBLE: MFA bypass with timing attack
app.post('/api/login/impossible', (req, res) => {
  const { username, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
  
  // Generate MFA secret if not exists
  if (!user.mfa_secret) {
    const secret = speakeasy.generateSecret({ length: 20 });
    db.prepare('UPDATE users SET mfa_secret = ? WHERE id = ?').run(secret.base32, user.id);
    user.mfa_secret = secret.base32;
  }
  
  res.json({ 
    success: true, 
    requiresMFA: true, 
    userId: user.id,
    hint: 'MFA required - but timing attack possible'
  });
});

// MFA verification with timing attack vulnerability
app.post('/api/mfa/verify', (req, res) => {
  const { userId, code } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  
  if (!user || !user.mfa_secret) {
    return res.status(401).json({ error: 'Invalid user' });
  }
  
  // Vulnerable: Timing attack - character-by-character comparison
  const validCode = speakeasy.totp({
    secret: user.mfa_secret,
    encoding: 'base32'
  });
  
  // Simulate timing vulnerability
  let matches = 0;
  for (let i = 0; i < Math.min(code.length, validCode.length); i++) {
    if (code[i] === validCode[i]) {
      matches++;
      // Vulnerable: Delay increases with correct characters
      crypto.randomBytes(1000);
    }
  }
  
  const isValid = code === validCode;
  
  if (isValid) {
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      SECRET_KEY
    );
    
    const secret = db.prepare('SELECT flag FROM secrets WHERE difficulty = "impossible"').get();
    
    res.json({ 
      success: true, 
      token,
      flag: user.role === 'admin' ? secret.flag : null
    });
  } else {
    res.status(401).json({ 
      success: false, 
      matches, // Vulnerable: Leaks information
      hint: `${matches} characters correct`
    });
  }
});

// Get all flags (for testing)
app.get('/api/flags', (req, res) => {
  const flags = db.prepare('SELECT * FROM secrets ORDER BY id').all();
  res.json({ flags });
});

// Home page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Broken Authentication Lab</title>
      <style>
        body { background: #0a0e27; color: #00d9ff; font-family: 'Courier New', monospace; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #00d9ff; text-shadow: 0 0 10px #00d9ff; }
        .level { background: #1a1f3a; padding: 20px; margin: 20px 0; border-radius: 10px; border: 1px solid #00d9ff; }
        .level h2 { color: #ff3366; }
        input, button { background: #1a1f3a; color: #00d9ff; border: 1px solid #00d9ff; padding: 10px; margin: 5px; }
        button { cursor: pointer; }
        button:hover { background: #00d9ff; color: #0a0e27; }
        .hint { color: #ffaa00; font-size: 0.9em; margin-top: 10px; }
        .result { margin-top: 10px; padding: 10px; border-radius: 5px; }
        .success { background: #00ff0030; border: 1px solid #00ff00; }
        .error { background: #ff000030; border: 1px solid #ff0000; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔓 Broken Authentication Lab</h1>
        <p>Exploit authentication vulnerabilities to capture flags!</p>
        
        <div class="level">
          <h2>EASY: Weak Password Brute Force</h2>
          <p>Find credentials with weak passwords. Try common usernames and passwords.</p>
          <input type="text" id="easy-user" placeholder="Username">
          <input type="password" id="easy-pass" placeholder="Password">
          <button onclick="loginEasy()">Login</button>
          <div id="easy-result"></div>
          <div class="hint">Hint: One user has "admin" as username. Another has their name as password.</div>
        </div>
        
        <div class="level">
          <h2>MEDIUM: Session Hijacking</h2>
          <p>Session IDs are predictable. Can you hijack an admin session?</p>
          <input type="text" id="med-user" placeholder="Username">
          <input type="password" id="med-pass" placeholder="Password">
          <button onclick="loginMedium()">Login</button>
          <button onclick="checkSession()">Check Session</button>
          <div id="med-result"></div>
          <div class="hint">Hint: Session IDs are sequential numbers between 1000-1100. Try guessing admin's session.</div>
        </div>
        
        <div class="level">
          <h2>HARD: JWT Forgery</h2>
          <p>JWT tokens use a weak secret. Can you forge an admin token?</p>
          <input type="text" id="hard-user" placeholder="Username">
          <input type="password" id="hard-pass" placeholder="Password">
          <button onclick="loginHard()">Login</button>
          <button onclick="verifyJWT()">Verify Token</button>
          <div id="hard-result"></div>
          <div class="hint">Hint: JWT secret is "abc123". Try algorithm confusion or brute force the secret.</div>
        </div>
        
        <div class="level">
          <h2>IMPOSSIBLE: MFA Timing Attack</h2>
          <p>Multi-factor authentication with timing vulnerability. Can you bypass it?</p>
          <input type="text" id="imp-user" placeholder="Username" value="admin">
          <input type="password" id="imp-pass" placeholder="Password" value="admin123">
          <button onclick="loginImpossible()">Login</button>
          <br>
          <input type="text" id="imp-code" placeholder="MFA Code (6 digits)">
          <button onclick="verifyMFA()">Verify MFA</button>
          <div id="imp-result"></div>
          <div class="hint">Hint: Response time increases with correct digits. Use timing attack to guess code.</div>
        </div>
      </div>
      
      <script>
        let currentUserId = null;
        let currentToken = null;
        
        async function loginEasy() {
          const username = document.getElementById('easy-user').value;
          const password = document.getElementById('easy-pass').value;
          
          const res = await fetch('/api/login/easy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });
          
          const data = await res.json();
          const result = document.getElementById('easy-result');
          
          if (data.success) {
            result.className = 'result success';
            result.innerHTML = data.flag 
              ? \`✅ FLAG: <strong>\${data.flag}</strong>\`
              : \`Logged in as \${data.user.role}\`;
          } else {
            result.className = 'result error';
            result.innerHTML = '❌ ' + data.error;
          }
        }
        
        async function loginMedium() {
          const username = document.getElementById('med-user').value;
          const password = document.getElementById('med-pass').value;
          
          const res = await fetch('/api/login/medium', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });
          
          const data = await res.json();
          const result = document.getElementById('med-result');
          
          if (data.success) {
            result.className = 'result success';
            result.innerHTML = \`Session ID: \${data.sessionId} (Try guessing other session IDs)\`;
          } else {
            result.className = 'result error';
            result.innerHTML = '❌ Login failed';
          }
        }
        
        async function checkSession() {
          const res = await fetch('/api/session/check');
          const data = await res.json();
          const result = document.getElementById('med-result');
          
          if (data.user) {
            result.className = 'result success';
            result.innerHTML = data.flag
              ? \`✅ FLAG: <strong>\${data.flag}</strong>\`
              : \`Logged in as \${data.user.role}\`;
          } else {
            result.className = 'result error';
            result.innerHTML = '❌ ' + data.error;
          }
        }
        
        async function loginHard() {
          const username = document.getElementById('hard-user').value;
          const password = document.getElementById('hard-pass').value;
          
          const res = await fetch('/api/login/hard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });
          
          const data = await res.json();
          const result = document.getElementById('hard-result');
          
          if (data.success) {
            currentToken = data.token;
            result.className = 'result success';
            result.innerHTML = \`Token: \${data.token}\`;
          } else {
            result.className = 'result error';
            result.innerHTML = '❌ Login failed';
          }
        }
        
        async function verifyJWT() {
          const res = await fetch('/api/jwt/verify', {
            headers: { 'Authorization': 'Bearer ' + currentToken }
          });
          
          const data = await res.json();
          const result = document.getElementById('hard-result');
          
          if (data.user) {
            result.className = 'result success';
            result.innerHTML = data.flag
              ? \`✅ FLAG: <strong>\${data.flag}</strong>\`
              : \`Verified as \${data.user.role}\`;
          } else {
            result.className = 'result error';
            result.innerHTML = '❌ ' + data.error;
          }
        }
        
        async function loginImpossible() {
          const username = document.getElementById('imp-user').value;
          const password = document.getElementById('imp-pass').value;
          
          const res = await fetch('/api/login/impossible', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });
          
          const data = await res.json();
          const result = document.getElementById('imp-result');
          
          if (data.success && data.requiresMFA) {
            currentUserId = data.userId;
            result.className = 'result success';
            result.innerHTML = 'MFA Required. ' + data.hint;
          } else {
            result.className = 'result error';
            result.innerHTML = '❌ ' + data.error;
          }
        }
        
        async function verifyMFA() {
          const code = document.getElementById('imp-code').value;
          
          const start = Date.now();
          const res = await fetch('/api/mfa/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUserId, code })
          });
          const elapsed = Date.now() - start;
          
          const data = await res.json();
          const result = document.getElementById('imp-result');
          
          if (data.success) {
            result.className = 'result success';
            result.innerHTML = data.flag
              ? \`✅ FLAG: <strong>\${data.flag}</strong>\`
              : 'MFA Verified!';
          } else {
            result.className = 'result error';
            result.innerHTML = \`❌ \${data.hint} (Response time: \${elapsed}ms)\`;
          }
        }
      </script>
    </body>
    </html>
  `);
});

app.listen(80, () => {
  console.log('Broken Authentication Lab running on port 80');
});
