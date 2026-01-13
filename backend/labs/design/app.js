const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage
let users = [
    { id: 1, username: 'alice', balance: 1000, isAdmin: false },
    { id: 2, username: 'bob', balance: 500, isAdmin: false },
    { id: 3, username: 'admin', balance: 10000, isAdmin: true }
];

let transfers = [];
let coupons = [
    { code: 'DISCOUNT10', value: 10, used: false },
    { code: 'DISCOUNT50', value: 50, used: false },
    { code: 'FLAG_CODE', value: 100, used: false, flag: 'FLAG{l0g1c_fl4w_f0und}' }
];

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Insecure Design Lab</title>
    <style>
        body { background: #0a0e27; color: #00d9ff; font-family: 'Courier New', monospace; padding: 20px; }
        .container { max-width: 1000px; margin: 0 auto; }
        h1 { color: #00d9ff; text-shadow: 0 0 10px #00d9ff; }
        .level { background: #1a1f3a; padding: 20px; margin: 20px 0; border-radius: 10px; border: 1px solid #00d9ff; }
        .level h2 { color: #ff3366; }
        input, select { background: #1a1f3a; color: #00d9ff; border: 1px solid #00d9ff; padding: 10px; margin: 5px; }
        button { background: #1a1f3a; color: #00d9ff; border: 1px solid #00d9ff; padding: 10px 20px; cursor: pointer; margin: 5px; }
        button:hover { background: #00d9ff; color: #0a0e27; }
        .hint { color: #ffaa00; font-size: 0.9em; margin-top: 10px; }
        .result { margin-top: 10px; padding: 15px; border-radius: 5px; background: #1a1f3a; border: 1px solid #00d9ff; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 Insecure Design Lab</h1>
        <p>Exploit fundamental design flaws!</p>
        
        <div class="level">
            <h2>EASY: Coupon Reuse Logic Flaw</h2>
            <p>Coupons can be reused due to poor design.</p>
            
            <input type="text" id="coupon-code" placeholder="Coupon code" value="DISCOUNT10">
            <button onclick="applyCoupon()">Apply Coupon</button>
            <button onclick="applyCoupon()">Apply Again</button>
            
            <div id="easy-result" class="result" style="display:none;"></div>
            <div class="hint">Hint: Try applying the same coupon multiple times. Try code: FLAG_CODE</div>
        </div>
        
        <div class="level">
            <h2>MEDIUM: Price Manipulation via Client-Side</h2>
            <p>Purchase items where price is set client-side.</p>
            
            <select id="item">
                <option value="apple">Apple - $5</option>
                <option value="laptop">Laptop - $1000</option>
            </select>
            <input type="number" id="price" value="5" placeholder="Price">
            <input type="number" id="quantity" value="1" placeholder="Quantity">
            <button onclick="purchase()">Purchase</button>
            
            <div id="med-result" class="result" style="display:none;"></div>
            <div class="hint">Hint: Modify the price field to buy expensive items for cheap</div>
        </div>
        
        <div class="level">
            <h2>HARD: Race Condition in Transfer</h2>
            <p>Transfer money with race condition vulnerability.</p>
            
            <select id="from-user">
                <option value="1">Alice ($1000)</option>
                <option value="2">Bob ($500)</option>
            </select>
            <select id="to-user">
                <option value="2">Bob</option>
                <option value="3">Admin</option>
            </select>
            <input type="number" id="amount" value="100" placeholder="Amount">
            <button onclick="rapidTransfer()">Send Multiple Transfers</button>
            
            <div id="hard-result" class="result" style="display:none;"></div>
            <div class="hint">Hint: Send multiple transfer requests rapidly to overdraw balance</div>
        </div>
        
        <div class="level">
            <h2>IMPOSSIBLE: Business Logic Chain</h2>
            <p>Combine multiple flaws to become admin.</p>
            
            <button onclick="exploitChain()">Execute Exploit Chain</button>
            
            <div id="imp-result" class="result" style="display:none;"></div>
            <div class="hint">Hint: Reuse coupon → manipulate price → race condition → privilege escalation</div>
        </div>
    </div>
    
    <script>
        async function applyCoupon() {
            const code = document.getElementById('coupon-code').value;
            
            const res = await fetch('/api/coupon/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            
            const data = await res.json();
            const result = document.getElementById('easy-result');
            result.style.display = 'block';
            result.innerHTML = JSON.stringify(data, null, 2);
        }
        
        async function purchase() {
            const item = document.getElementById('item').value;
            const price = document.getElementById('price').value;
            const quantity = document.getElementById('quantity').value;
            
            const res = await fetch('/api/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item, price: parseFloat(price), quantity: parseInt(quantity) })
            });
            
            const data = await res.json();
            const result = document.getElementById('med-result');
            result.style.display = 'block';
            result.innerHTML = JSON.stringify(data, null, 2);
        }
        
        async function rapidTransfer() {
            const fromUser = document.getElementById('from-user').value;
            const toUser = document.getElementById('to-user').value;
            const amount = document.getElementById('amount').value;
            
            const result = document.getElementById('hard-result');
            result.style.display = 'block';
            result.innerHTML = 'Sending transfers...';
            
            const requests = [];
            for (let i = 0; i < 5; i++) {
                requests.push(
                    fetch('/api/transfer', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fromUser: parseInt(fromUser), toUser: parseInt(toUser), amount: parseFloat(amount) })
                    }).then(r => r.json())
                );
            }
            
            const responses = await Promise.all(requests);
            result.innerHTML = JSON.stringify(responses, null, 2);
        }
        
        async function exploitChain() {
            const result = document.getElementById('imp-result');
            result.style.display = 'block';
            result.innerHTML = 'Executing exploit chain...<br><br>';
            
            // Step 1: Reuse expensive coupon
            for (let i = 0; i < 10; i++) {
                await fetch('/api/coupon/apply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: 'FLAG_CODE' })
                });
            }
            result.innerHTML += 'Step 1: Coupon reused 10 times ✓<br>';
            
            // Step 2: Buy laptop for $1
            await fetch('/api/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item: 'laptop', price: 1, quantity: 1 })
            });
            result.innerHTML += 'Step 2: Bought laptop for $1 ✓<br>';
            
            // Step 3: Get final flag
            const flagRes = await fetch('/api/admin/flag');
            const flagData = await flagRes.json();
            result.innerHTML += 'Step 3: ' + JSON.stringify(flagData, null, 2);
        }
    </script>
</body>
</html>
    `);
});

// EASY: Coupon reuse
app.post('/api/coupon/apply', (req, res) => {
    const { code } = req.body;
    
    const coupon = coupons.find(c => c.code === code);
    
    if (!coupon) {
        return res.json({ success: false, error: 'Invalid coupon' });
    }
    
    // Vulnerable: No check if coupon was already used
    res.json({ 
        success: true, 
        discount: coupon.value,
        flag: coupon.flag || null,
        message: `Coupon applied! $${coupon.value} discount`
    });
});

// MEDIUM: Client-side price manipulation
let purchases = [];
app.post('/api/purchase', (req, res) => {
    const { item, price, quantity } = req.body;
    
    // Vulnerable: Trusts client-provided price
    const total = price * quantity;
    
    purchases.push({ item, price, quantity, total });
    
    let flag = null;
    if (item === 'laptop' && price < 10) {
        flag = 'FLAG{bus1n3ss_l0g1c_byp4ss}';
    }
    
    res.json({ 
        success: true, 
        item, 
        total, 
        flag,
        message: `Purchased ${quantity} ${item}(s) for $${total}`
    });
});

// HARD: Race condition in transfer
app.post('/api/transfer', (req, res) => {
    const { fromUser, toUser, amount } = req.body;
    
    const sender = users.find(u => u.id === fromUser);
    const receiver = users.find(u => u.id === toUser);
    
    if (!sender || !receiver) {
        return res.json({ success: false, error: 'Invalid users' });
    }
    
    // Vulnerable: No locking mechanism, race condition possible
    if (sender.balance >= amount) {
        setTimeout(() => {
            sender.balance -= amount;
            receiver.balance += amount;
        }, 10);
        
        transfers.push({ from: fromUser, to: toUser, amount, timestamp: Date.now() });
        
        let flag = null;
        if (transfers.length > 10) {
            flag = 'FLAG{r4c3_c0nd1t10n_3xpl01t}';
        }
        
        res.json({ 
            success: true, 
            flag,
            message: `Transferred $${amount}`
        });
    } else {
        res.json({ success: false, error: 'Insufficient balance' });
    }
});

// IMPOSSIBLE: Final flag
app.get('/api/admin/flag', (req, res) => {
    res.json({ 
        flag: 'FLAG{arch1t3ctur3_c0mpr0m1s3}',
        message: 'Combined multiple design flaws successfully!'
    });
});

app.listen(80, () => {
    console.log('Insecure Design Lab running on port 80');
});
