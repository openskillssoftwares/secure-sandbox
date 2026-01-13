const express = require('express');
const Database = require('better-sqlite3');

const app = express();
const db = new Database('bank.db');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>SecureBank™ - Banking System Lab</title>
    <style>
        body { background: #0a0e27; color: #00d9ff; font-family: 'Courier New', monospace; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #00d9ff; text-shadow: 0 0 10px #00d9ff; }
        .bank-logo { font-size: 3em; text-align: center; margin: 20px 0; }
        .level { background: #1a1f3a; padding: 20px; margin: 20px 0; border-radius: 10px; border: 1px solid #00d9ff; }
        .level h2 { color: #ff3366; }
        input, select { background: #1a1f3a; color: #00d9ff; border: 1px solid #00d9ff; padding: 10px; margin: 5px; }
        button { background: #1a1f3a; color: #00d9ff; border: 1px solid #00d9ff; padding: 10px 20px; cursor: pointer; margin: 5px; }
        button:hover { background: #00d9ff; color: #0a0e27; }
        .hint { color: #ffaa00; font-size: 0.9em; margin-top: 10px; }
        .result { margin-top: 10px; padding: 15px; border-radius: 5px; background: #1a1f3a; border: 1px solid #00d9ff; }
        .balance { font-size: 2em; color: #00ff00; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 10px; border: 1px solid #00d9ff; text-align: left; }
        th { background: #2a2f4a; }
    </style>
</head>
<body>
    <div class="container">
        <div class="bank-logo">🏦 SecureBank™</div>
        <h1>Banking System Vulnerability Lab</h1>
        <p>Hack into the banking system and steal money... ethically!</p>
        
        <div class="level">
            <h2>EASY: Account Enumeration</h2>
            <p>Discover valid account numbers and access account information.</p>
            
            <input type="text" id="enum-account" placeholder="Account Number" value="1001">
            <input type="text" id="enum-pin" placeholder="PIN" value="1234">
            <button onclick="checkAccount()">Check Account</button>
            <button onclick="bruteForce()">Auto-Enumerate</button>
            
            <div id="easy-result" class="result" style="display:none;"></div>
            <div class="hint">Hint: Try account numbers 1001-1003, 9999. PINs are 4 digits.</div>
        </div>
        
        <div class="level">
            <h2>MEDIUM: Transaction Manipulation via SQL Injection</h2>
            <p>Transfer money using SQL injection to manipulate transactions.</p>
            
            <input type="text" id="from-account" placeholder="From Account" value="1001">
            <input type="text" id="to-account" placeholder="To Account" value="1002">
            <input type="number" id="amount" placeholder="Amount" value="100">
            <button onclick="transfer()">Transfer Money</button>
            <button onclick="getTransactions()">View Transactions</button>
            
            <div id="med-result" class="result" style="display:none;"></div>
            <div class="hint">Hint: SQL injection in account number field. Try: 1002' OR '1'='1</div>
        </div>
        
        <div class="level">
            <h2>HARD: Race Condition in Concurrent Transfers</h2>
            <p>Exploit race condition to transfer more money than available balance.</p>
            
            <input type="text" id="race-from" placeholder="From Account" value="1001">
            <input type="text" id="race-to" placeholder="To Account" value="1002">
            <input type="number" id="race-amount" placeholder="Amount per transfer" value="1000">
            <button onclick="raceCondition()">Send 10 Concurrent Transfers</button>
            
            <div id="hard-result" class="result" style="display:none;"></div>
            <div class="hint">Hint: Send multiple transfers simultaneously before balance is updated</div>
        </div>
        
        <div class="level">
            <h2>IMPOSSIBLE: Full Bank Takeover</h2>
            <p>Combine all vulnerabilities to access admin panel and get complete control.</p>
            
            <button onclick="fullExploit()">Execute Full Exploit</button>
            <button onclick="getAdminLogs()">Access Admin Logs</button>
            
            <div id="imp-result" class="result" style="display:none;"></div>
            <div class="hint">Hint: Enumerate accounts → SQL inject admin → Race condition → Access logs</div>
        </div>
        
        <div class="level">
            <h2>Account Balances</h2>
            <button onclick="getAllBalances()">View All Accounts (Debug)</button>
            <div id="balances" class="result" style="display:none;"></div>
        </div>
    </div>
    
    <script>
        async function checkAccount() {
            const account = document.getElementById('enum-account').value;
            const pin = document.getElementById('enum-pin').value;
            
            const res = await fetch('/api/account/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ account, pin })
            });
            
            const data = await res.json();
            const result = document.getElementById('easy-result');
            result.style.display = 'block';
            result.innerHTML = JSON.stringify(data, null, 2);
        }
        
        async function bruteForce() {
            const result = document.getElementById('easy-result');
            result.style.display = 'block';
            result.innerHTML = 'Enumerating accounts...<br><br>';
            
            for (let i = 1000; i <= 1005; i++) {
                const res = await fetch('/api/account/check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ account: i.toString(), pin: '0000' })
                });
                const data = await res.json();
                if (data.exists) {
                    result.innerHTML += \`Account \${i}: EXISTS (Balance: \${data.balance})<br>\`;
                }
            }
            
            // Check special account
            const special = await fetch('/api/account/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ account: '9999', pin: '0000' })
            });
            const specialData = await special.json();
            result.innerHTML += '<br>' + JSON.stringify(specialData, null, 2);
        }
        
        async function transfer() {
            const from = document.getElementById('from-account').value;
            const to = document.getElementById('to-account').value;
            const amount = document.getElementById('amount').value;
            
            const res = await fetch('/api/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ from, to, amount: parseFloat(amount) })
            });
            
            const data = await res.json();
            const result = document.getElementById('med-result');
            result.style.display = 'block';
            result.innerHTML = JSON.stringify(data, null, 2);
        }
        
        async function getTransactions() {
            const res = await fetch('/api/transactions');
            const data = await res.json();
            
            const result = document.getElementById('med-result');
            result.style.display = 'block';
            result.innerHTML = '<table><tr><th>From</th><th>To</th><th>Amount</th><th>Status</th></tr>' +
                data.transactions.map(t => \`<tr><td>\${t.from_account}</td><td>\${t.to_account}</td><td>$\${t.amount}</td><td>\${t.status}</td></tr>\`).join('') +
                '</table>';
        }
        
        async function raceCondition() {
            const from = document.getElementById('race-from').value;
            const to = document.getElementById('race-to').value;
            const amount = document.getElementById('race-amount').value;
            
            const result = document.getElementById('hard-result');
            result.style.display = 'block';
            result.innerHTML = 'Sending concurrent transfers...<br><br>';
            
            const requests = [];
            for (let i = 0; i < 10; i++) {
                requests.push(
                    fetch('/api/transfer', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ from, to, amount: parseFloat(amount) })
                    }).then(r => r.json())
                );
            }
            
            const responses = await Promise.all(requests);
            const successful = responses.filter(r => r.success).length;
            
            result.innerHTML += \`Successful transfers: \${successful}/10<br><br>\`;
            result.innerHTML += JSON.stringify(responses[0], null, 2);
            
            if (successful > 5) {
                result.innerHTML += '<br><br>🎉 Race condition exploited! Check admin logs.';
            }
        }
        
        async function getAdminLogs() {
            const res = await fetch('/api/admin/logs');
            const data = await res.json();
            
            const result = document.getElementById('imp-result');
            result.style.display = 'block';
            result.innerHTML = JSON.stringify(data, null, 2);
        }
        
        async function fullExploit() {
            const result = document.getElementById('imp-result');
            result.style.display = 'block';
            result.innerHTML = 'Executing full exploit chain...<br><br>';
            
            // Step 1: Enumerate accounts
            result.innerHTML += 'Step 1: Account enumeration... ✓<br>';
            
            // Step 2: SQL injection
            await fetch('/api/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ from: "1002' OR '1'='1", to: '1001', amount: 1000 })
            });
            result.innerHTML += 'Step 2: SQL injection executed... ✓<br>';
            
            // Step 3: Race condition
            const raceRequests = [];
            for (let i = 0; i < 10; i++) {
                raceRequests.push(
                    fetch('/api/transfer', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ from: '1001', to: '1002', amount: 1000 })
                    })
                );
            }
            await Promise.all(raceRequests);
            result.innerHTML += 'Step 3: Race condition exploited... ✓<br>';
            
            // Step 4: Access admin
            const adminRes = await fetch('/api/admin/logs');
            const adminData = await adminRes.json();
            result.innerHTML += 'Step 4: Admin access gained!<br><br>';
            result.innerHTML += JSON.stringify(adminData, null, 2);
        }
        
        async function getAllBalances() {
            const res = await fetch('/api/accounts/all');
            const data = await res.json();
            
            const result = document.getElementById('balances');
            result.style.display = 'block';
            result.innerHTML = '<table><tr><th>Account</th><th>Owner</th><th>Balance</th></tr>' +
                data.accounts.map(a => \`<tr><td>\${a.account_number}</td><td>\${a.owner}</td><td class="balance">$\${a.balance}</td></tr>\`).join('') +
                '</table>';
        }
    </script>
</body>
</html>
    `);
});

// EASY: Account enumeration
app.post('/api/account/check', (req, res) => {
    const { account, pin } = req.body;
    
    // Vulnerable: Reveals account existence
    const acc = db.prepare('SELECT * FROM accounts WHERE account_number = ?').get(account);
    
    if (!acc) {
        return res.json({ exists: false, error: 'Account not found' });
    }
    
    if (acc.pin !== pin) {
        return res.json({ 
            exists: true, 
            error: 'Invalid PIN',
            hint: 'Account exists but PIN is wrong'
        });
    }
    
    // Return flag if special account
    if (acc.account_number === '9999') {
        return res.json({
            exists: true,
            authenticated: true,
            account: acc.account_number,
            owner: acc.owner,
            balance: acc.balance,
            flag: acc.pin
        });
    }
    
    res.json({
        exists: true,
        authenticated: true,
        account: acc.account_number,
        owner: acc.owner,
        balance: acc.balance
    });
});

// MEDIUM: SQL injection in transfer
app.post('/api/transfer', (req, res) => {
    const { from, to, amount } = req.body;
    
    try {
        // Vulnerable: SQL injection
        const fromAcc = db.prepare(\`SELECT * FROM accounts WHERE account_number = '\${from}'\`).get();
        
        if (!fromAcc) {
            return res.json({ success: false, error: 'Source account not found' });
        }
        
        // Vulnerable: No proper locking, race condition possible
        if (fromAcc.balance >= amount) {
            // Simulate processing delay
            setTimeout(() => {
                db.prepare('UPDATE accounts SET balance = balance - ? WHERE account_number = ?').run(amount, from);
                db.prepare('UPDATE accounts SET balance = balance + ? WHERE account_number = ?').run(amount, to);
            }, 50);
            
            db.prepare('INSERT INTO transactions (from_account, to_account, amount, status, timestamp) VALUES (?, ?, ?, ?, ?)').run(from, to, amount, 'completed', Date.now());
            
            // Check for SQL injection flag
            const adminLog = db.prepare('SELECT * FROM admin_logs WHERE id = 1').get();
            
            res.json({ 
                success: true, 
                message: \`Transferred $\${amount} from \${from} to \${to}\`,
                flag: from.includes("'") ? adminLog.flag : null
            });
        } else {
            res.json({ success: false, error: 'Insufficient balance' });
        }
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// Get transactions
app.get('/api/transactions', (req, res) => {
    const transactions = db.prepare('SELECT * FROM transactions ORDER BY id DESC LIMIT 20').all();
    res.json({ transactions });
});

// IMPOSSIBLE: Admin logs
app.get('/api/admin/logs', (req, res) => {
    const logs = db.prepare('SELECT * FROM admin_logs').all();
    res.json({ logs });
});

// Debug endpoint
app.get('/api/accounts/all', (req, res) => {
    const accounts = db.prepare('SELECT account_number, owner, balance FROM accounts').all();
    res.json({ accounts });
});

app.listen(80, () => {
    console.log('SecureBank running on port 80');
});
