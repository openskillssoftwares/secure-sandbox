from flask import Flask, request, render_template_string, jsonify
import requests
import socket
import re
from urllib.parse import urlparse

app = Flask(__name__)

# Simulated cloud metadata endpoint
CLOUD_METADATA = {
    "instance-id": "i-1234567890abcdef0",
    "aws-account-id": "123456789012",
    "secret-key": "FLAG{cl0ud_m3t4d4t4_l34k}",
    "iam-role": "admin-role",
    "credentials": {
        "AccessKeyId": "AKIAIOSFODNN7EXAMPLE",
        "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
    }
}

HOME_PAGE = '''
<!DOCTYPE html>
<html>
<head>
    <title>SSRF Vulnerability Lab</title>
    <style>
        body { background: #0a0e27; color: #00d9ff; font-family: 'Courier New', monospace; padding: 20px; }
        .container { max-width: 1000px; margin: 0 auto; }
        h1 { color: #00d9ff; text-shadow: 0 0 10px #00d9ff; }
        .level { background: #1a1f3a; padding: 20px; margin: 20px 0; border-radius: 10px; border: 1px solid #00d9ff; }
        .level h2 { color: #ff3366; }
        input { background: #1a1f3a; color: #00d9ff; border: 1px solid #00d9ff; padding: 10px; width: 500px; margin: 5px; }
        button { background: #1a1f3a; color: #00d9ff; border: 1px solid #00d9ff; padding: 10px 20px; cursor: pointer; }
        button:hover { background: #00d9ff; color: #0a0e27; }
        .hint { color: #ffaa00; font-size: 0.9em; margin-top: 10px; }
        .result { margin-top: 10px; padding: 15px; border-radius: 5px; background: #1a1f3a; border: 1px solid #00d9ff; max-height: 400px; overflow-y: auto; }
        pre { color: #00ff00; white-space: pre-wrap; }
        .error { color: #ff3366; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌐 Server-Side Request Forgery Lab</h1>
        <p>Exploit SSRF vulnerabilities to access internal resources!</p>
        
        <div class="level">
            <h2>EASY: Basic SSRF - Localhost Access</h2>
            <p>The application fetches URLs. Can you make it fetch internal resources?</p>
            <input type="text" id="easy-url" placeholder="http://example.com" value="http://example.com">
            <button onclick="fetchEasy()">Fetch URL</button>
            <div id="easy-result" class="result"></div>
            <div class="hint">Hint: Try accessing http://localhost:8080/easy_flag.txt or http://127.0.0.1:8080/easy_flag.txt</div>
        </div>
        
        <div class="level">
            <h2>MEDIUM: Bypassing Blacklist Filters</h2>
            <p>The application blocks "localhost" and "127.0.0.1". Can you bypass the filter?</p>
            <input type="text" id="med-url" placeholder="http://example.com" value="http://example.com">
            <button onclick="fetchMedium()">Fetch URL</button>
            <div id="med-result" class="result"></div>
            <div class="hint">Hint: Try alternative representations like 0.0.0.0, 127.1, [::1], or redirect chains</div>
        </div>
        
        <div class="level">
            <h2>HARD: Cloud Metadata Exploitation</h2>
            <p>Access cloud metadata service at 169.254.169.254</p>
            <input type="text" id="hard-url" placeholder="http://example.com" value="http://example.com">
            <button onclick="fetchHard()">Fetch URL</button>
            <div id="hard-result" class="result"></div>
            <div class="hint">Hint: Cloud metadata at http://169.254.169.254/latest/meta-data/ (simulated)</div>
        </div>
        
        <div class="level">
            <h2>IMPOSSIBLE: Blind SSRF with DNS Rebinding</h2>
            <p>No response is shown. Use out-of-band techniques to exfiltrate data.</p>
            <input type="text" id="imp-url" placeholder="http://example.com" value="http://example.com">
            <button onclick="fetchImpossible()">Trigger Request</button>
            <br><br>
            <input type="text" id="verify-code" placeholder="Verification code">
            <button onclick="verifyCode()">Verify Access</button>
            <div id="imp-result" class="result"></div>
            <div class="hint">Hint: Use DNS rebinding or time-based techniques. Admin endpoint returns verification code.</div>
        </div>
    </div>
    
    <script>
        async function fetchEasy() {
            const url = document.getElementById('easy-url').value;
            const result = document.getElementById('easy-result');
            result.innerHTML = 'Loading...';
            
            const res = await fetch('/api/fetch/easy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            
            const data = await res.json();
            if (data.success) {
                result.innerHTML = '<pre>' + escapeHtml(data.content) + '</pre>';
            } else {
                result.innerHTML = '<span class="error">' + data.error + '</span>';
            }
        }
        
        async function fetchMedium() {
            const url = document.getElementById('med-url').value;
            const result = document.getElementById('med-result');
            result.innerHTML = 'Loading...';
            
            const res = await fetch('/api/fetch/medium', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            
            const data = await res.json();
            if (data.success) {
                result.innerHTML = '<pre>' + escapeHtml(data.content) + '</pre>';
            } else {
                result.innerHTML = '<span class="error">' + data.error + '</span>';
            }
        }
        
        async function fetchHard() {
            const url = document.getElementById('hard-url').value;
            const result = document.getElementById('hard-result');
            result.innerHTML = 'Loading...';
            
            const res = await fetch('/api/fetch/hard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            
            const data = await res.json();
            if (data.success) {
                result.innerHTML = '<pre>' + JSON.stringify(data.content, null, 2) + '</pre>';
            } else {
                result.innerHTML = '<span class="error">' + data.error + '</span>';
            }
        }
        
        async function fetchImpossible() {
            const url = document.getElementById('imp-url').value;
            const result = document.getElementById('imp-result');
            result.innerHTML = 'Request sent...';
            
            const res = await fetch('/api/fetch/impossible', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            
            const data = await res.json();
            result.innerHTML = data.message;
        }
        
        async function verifyCode() {
            const code = document.getElementById('verify-code').value;
            const result = document.getElementById('imp-result');
            
            const res = await fetch('/api/verify/code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            
            const data = await res.json();
            if (data.success) {
                result.innerHTML = '<pre style="color: #00ff00;">✅ ' + data.flag + '</pre>';
            } else {
                result.innerHTML = '<span class="error">❌ Invalid code</span>';
            }
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>
'''

# EASY: Basic SSRF without filtering
@app.route('/api/fetch/easy', methods=['POST'])
def fetch_easy():
    url = request.json.get('url', '')
    
    try:
        # Vulnerable: No validation
        response = requests.get(url, timeout=5)
        return jsonify({
            'success': True,
            'content': response.text[:5000]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# MEDIUM: Blacklist bypass challenge
@app.route('/api/fetch/medium', methods=['POST'])
def fetch_medium():
    url = request.json.get('url', '')
    
    # Vulnerable: Weak blacklist
    if 'localhost' in url.lower() or '127.0.0.1' in url:
        return jsonify({
            'success': False,
            'error': 'Access to localhost is blocked!'
        })
    
    try:
        # Still vulnerable to bypass techniques
        response = requests.get(url, timeout=5)
        return jsonify({
            'success': True,
            'content': response.text[:5000]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# HARD: Cloud metadata simulation
@app.route('/api/fetch/hard', methods=['POST'])
def fetch_hard():
    url = request.json.get('url', '')
    
    # Vulnerable: No proper validation
    if 'localhost' in url.lower() or '127.0.0' in url:
        return jsonify({
            'success': False,
            'error': 'Localhost blocked'
        })
    
    try:
        # Simulate cloud metadata service
        if '169.254.169.254' in url:
            return jsonify({
                'success': True,
                'content': CLOUD_METADATA
            })
        
        response = requests.get(url, timeout=5)
        return jsonify({
            'success': True,
            'content': response.text[:5000]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# IMPOSSIBLE: Blind SSRF
verification_code = "VERIFY_98765"

@app.route('/api/fetch/impossible', methods=['POST'])
def fetch_impossible():
    url = request.json.get('url', '')
    
    try:
        # Vulnerable: Makes request but doesn't return response
        response = requests.get(url, timeout=5)
        
        # Simulated: If admin endpoint accessed, returns verification code
        if 'localhost:8080/root_access.txt' in url or '127.1:8080/root_access.txt' in url:
            # In real scenario, this would be leaked via DNS/HTTP callback
            pass
        
        return jsonify({
            'success': True,
            'message': 'Request processed (no output shown)'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Request failed'
        })

@app.route('/api/verify/code', methods=['POST'])
def verify_code():
    code = request.json.get('code', '')
    
    if code == verification_code:
        return jsonify({
            'success': True,
            'flag': 'FLAG{bl1nd_ssrf_ch41n}'
        })
    
    return jsonify({
        'success': False,
        'error': 'Invalid code'
    })

# Simulated admin endpoint (internal only)
@app.route('/internal/admin')
def admin_endpoint():
    return jsonify({
        'verification_code': verification_code,
        'secret': 'Admin access granted'
    })

@app.route('/')
def home():
    return render_template_string(HOME_PAGE)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80, debug=False)
