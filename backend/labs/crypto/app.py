from flask import Flask, request, render_template_string, jsonify
import base64
import hashlib
import hmac
from Crypto.Cipher import AES, DES
from Crypto.Util.Padding import pad, unpad
import os
import time

app = Flask(__name__)

# Weak encryption keys
WEAK_KEY = b'1234567890123456'  # 16 bytes for AES
DES_KEY = b'weakkey8'  # 8 bytes for DES
HMAC_SECRET = b'secret'

HOME_PAGE = '''
<!DOCTYPE html>
<html>
<head>
    <title>Cryptographic Failures Lab</title>
    <style>
        body { background: #0a0e27; color: #00d9ff; font-family: 'Courier New', monospace; padding: 20px; }
        .container { max-width: 1000px; margin: 0 auto; }
        h1 { color: #00d9ff; text-shadow: 0 0 10px #00d9ff; }
        .level { background: #1a1f3a; padding: 20px; margin: 20px 0; border-radius: 10px; border: 1px solid #00d9ff; }
        .level h2 { color: #ff3366; }
        input, textarea { background: #1a1f3a; color: #00d9ff; border: 1px solid #00d9ff; padding: 10px; width: 80%; margin: 5px; }
        button { background: #1a1f3a; color: #00d9ff; border: 1px solid #00d9ff; padding: 10px 20px; cursor: pointer; margin: 5px; }
        button:hover { background: #00d9ff; color: #0a0e27; }
        .hint { color: #ffaa00; font-size: 0.9em; margin-top: 10px; }
        .result { margin-top: 10px; padding: 15px; border-radius: 5px; background: #1a1f3a; border: 1px solid #00d9ff; word-break: break-all; }
        pre { color: #00ff00; white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Cryptographic Failures Lab</h1>
        <p>Exploit weak encryption and break crypto implementations!</p>
        
        <div class="level">
            <h2>EASY: Base64 "Encryption"</h2>
            <p>The application uses Base64 encoding to "protect" sensitive data.</p>
            
            <div>
                <strong>Encrypted Message:</strong><br>
                <code id="easy-encrypted">RkxBR3tiNHMzXzY0XzNuYzBkMW5nfQ==</code>
            </div>
            
            <br>
            <input type="text" id="easy-decode" placeholder="Enter encoded text">
            <button onclick="decodeEasy()">Decode</button>
            
            <div id="easy-result" class="result" style="display:none;"></div>
            <div class="hint">Hint: Base64 is encoding, not encryption. Use CyberChef or atob() in browser console.</div>
        </div>
        
        <div class="level">
            <h2>MEDIUM: Weak Cipher (DES) with Known Key</h2>
            <p>Application uses DES encryption with a weak, predictable key.</p>
            
            <button onclick="getEncrypted()">Get Encrypted Data</button>
            <div id="med-encrypted" class="result" style="display:none;"></div>
            
            <br><br>
            <input type="text" id="med-decrypt" placeholder="Enter decrypted flag">
            <button onclick="submitMedium()">Submit Flag</button>
            
            <div id="med-result" class="result" style="display:none;"></div>
            <div class="hint">Hint: DES key is "weakkey8". Use CyberChef or Python's Crypto library to decrypt.</div>
        </div>
        
        <div class="level">
            <h2>HARD: Hash Collision Attack</h2>
            <p>MD5 hash collision vulnerability. Find two different inputs with same hash.</p>
            
            <input type="text" id="hard-input1" placeholder="Input 1" value="Hello">
            <input type="text" id="hard-input2" placeholder="Input 2" value="World">
            <button onclick="checkCollision()">Check Collision</button>
            
            <div id="hard-result" class="result" style="display:none;"></div>
            <div class="hint">Hint: Find MD5 collision pairs online or use known collision prefixes.</div>
        </div>
        
        <div class="level">
            <h2>IMPOSSIBLE: Padding Oracle Attack</h2>
            <p>AES-CBC with padding oracle vulnerability. Decrypt ciphertext without the key.</p>
            
            <div>
                <strong>Encrypted Token:</strong><br>
                <code id="imp-token"></code>
            </div>
            
            <br>
            <textarea id="imp-ciphertext" placeholder="Encrypted data (hex)" rows="3"></textarea>
            <button onclick="getPaddingOracle()">Test Padding</button>
            
            <div id="imp-result" class="result" style="display:none;"></div>
            <div class="hint">Hint: Use padding oracle attack tools or implement byte-by-byte decryption.</div>
        </div>
    </div>
    
    <script>
        function decodeEasy() {
            const encoded = document.getElementById('easy-decode').value || document.getElementById('easy-encrypted').textContent;
            try {
                const decoded = atob(encoded);
                document.getElementById('easy-result').style.display = 'block';
                document.getElementById('easy-result').innerHTML = '<pre>' + decoded + '</pre>';
            } catch(e) {
                document.getElementById('easy-result').style.display = 'block';
                document.getElementById('easy-result').innerHTML = 'Invalid Base64: ' + e.message;
            }
        }
        
        async function getEncrypted() {
            const res = await fetch('/api/crypto/medium');
            const data = await res.json();
            
            document.getElementById('med-encrypted').style.display = 'block';
            document.getElementById('med-encrypted').innerHTML = 
                '<strong>Encrypted (hex):</strong> ' + data.encrypted + '<br>' +
                '<strong>Algorithm:</strong> ' + data.algorithm + '<br>' +
                '<strong>Hint:</strong> ' + data.hint;
        }
        
        async function submitMedium() {
            const flag = document.getElementById('med-decrypt').value;
            
            const res = await fetch('/api/crypto/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ flag, level: 'medium' })
            });
            
            const data = await res.json();
            document.getElementById('med-result').style.display = 'block';
            document.getElementById('med-result').innerHTML = data.message;
        }
        
        async function checkCollision() {
            const input1 = document.getElementById('hard-input1').value;
            const input2 = document.getElementById('hard-input2').value;
            
            const res = await fetch('/api/crypto/collision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input1, input2 })
            });
            
            const data = await res.json();
            document.getElementById('hard-result').style.display = 'block';
            document.getElementById('hard-result').innerHTML = 
                '<strong>Input 1 MD5:</strong> ' + data.hash1 + '<br>' +
                '<strong>Input 2 MD5:</strong> ' + data.hash2 + '<br>' +
                '<strong>Match:</strong> ' + (data.collision ? 'YES ✅' : 'NO ❌') + '<br>' +
                (data.flag ? '<br><strong>FLAG:</strong> ' + data.flag : '');
        }
        
        async function getPaddingOracle() {
            const ciphertext = document.getElementById('imp-ciphertext').value;
            
            const res = await fetch('/api/crypto/padding-oracle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ciphertext })
            });
            
            const data = await res.json();
            document.getElementById('imp-result').style.display = 'block';
            document.getElementById('imp-result').innerHTML = 
                '<strong>Padding Valid:</strong> ' + (data.valid ? 'YES' : 'NO') + '<br>' +
                (data.error ? '<strong>Error:</strong> ' + data.error + '<br>' : '') +
                (data.flag ? '<br><strong>FLAG:</strong> ' + data.flag : '');
        }
        
        // Load impossible challenge on page load
        window.onload = async function() {
            const res = await fetch('/api/crypto/impossible');
            const data = await res.json();
            document.getElementById('imp-token').textContent = data.token;
            document.getElementById('imp-ciphertext').value = data.token;
        };
    </script>
</body>
</html>
'''

# EASY: Base64 encoding (already in page)
@app.route('/api/crypto/easy')
def crypto_easy():
    flag = "FLAG{b4s3_64_3nc0d1ng}"
    encoded = base64.b64encode(flag.encode()).decode()
    return jsonify({
        'encoded': encoded,
        'hint': 'This is just Base64 encoding, not encryption!'
    })

# MEDIUM: Weak DES encryption
@app.route('/api/crypto/medium')
def crypto_medium():
    flag = "FLAG{w34k_c1ph3r_cr4ck3d}"
    
    # DES encryption with weak key
    cipher = DES.new(DES_KEY, DES.MODE_ECB)
    encrypted = cipher.encrypt(pad(flag.encode(), DES.block_size))
    
    return jsonify({
        'encrypted': encrypted.hex(),
        'algorithm': 'DES-ECB',
        'hint': 'Key is "weakkey8" (8 bytes)'
    })

# Verify decrypted flag
@app.route('/api/crypto/verify', methods=['POST'])
def verify_flag():
    data = request.json
    flag = data.get('flag', '')
    level = data.get('level', 'medium')
    
    correct_flags = {
        'medium': 'FLAG{w34k_c1ph3r_cr4ck3d}',
        'hard': 'FLAG{h4sh_c0ll1s10n_f0und}',
        'impossible': 'FLAG{qu4ntum_r3s1st4nt_br0k3n}'
    }
    
    if flag == correct_flags.get(level):
        return jsonify({
            'success': True,
            'message': f'✅ Correct! {flag}'
        })
    else:
        return jsonify({
            'success': False,
            'message': '❌ Incorrect flag'
        })

# HARD: Hash collision
@app.route('/api/crypto/collision', methods=['POST'])
def check_collision():
    data = request.json
    input1 = data.get('input1', '').encode()
    input2 = data.get('input2', '').encode()
    
    hash1 = hashlib.md5(input1).hexdigest()
    hash2 = hashlib.md5(input2).hexdigest()
    
    collision = (hash1 == hash2 and input1 != input2)
    
    response = {
        'hash1': hash1,
        'hash2': hash2,
        'collision': collision
    }
    
    if collision:
        response['flag'] = 'FLAG{h4sh_c0ll1s10n_f0und}'
    
    return jsonify(response)

# IMPOSSIBLE: Padding oracle
@app.route('/api/crypto/impossible')
def crypto_impossible():
    flag = "FLAG{qu4ntum_r3s1st4nt_br0k3n}"
    
    # AES-CBC encryption
    iv = os.urandom(16)
    cipher = AES.new(WEAK_KEY, AES.MODE_CBC, iv)
    encrypted = cipher.encrypt(pad(flag.encode(), AES.block_size))
    
    # Return IV + ciphertext
    token = (iv + encrypted).hex()
    
    return jsonify({
        'token': token,
        'hint': 'AES-CBC with padding oracle vulnerability'
    })

@app.route('/api/crypto/padding-oracle', methods=['POST'])
def padding_oracle():
    data = request.json
    ciphertext_hex = data.get('ciphertext', '')
    
    try:
        ciphertext = bytes.fromhex(ciphertext_hex)
        
        if len(ciphertext) < 32:
            return jsonify({'valid': False, 'error': 'Ciphertext too short'})
        
        iv = ciphertext[:16]
        encrypted = ciphertext[16:]
        
        # Padding oracle vulnerability
        cipher = AES.new(WEAK_KEY, AES.MODE_CBC, iv)
        try:
            decrypted = unpad(cipher.decrypt(encrypted), AES.block_size)
            
            # If padding is valid and decrypts to flag, return it
            if b'FLAG{' in decrypted:
                return jsonify({
                    'valid': True,
                    'flag': decrypted.decode()
                })
            
            return jsonify({'valid': True})
        except ValueError:
            # Padding error
            return jsonify({'valid': False, 'error': 'Padding invalid'})
    except Exception as e:
        return jsonify({'valid': False, 'error': str(e)})

@app.route('/')
def home():
    return render_template_string(HOME_PAGE)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80, debug=False)
