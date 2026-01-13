<?php
session_start();

// Simulated login (in real lab, would have login page)
if (!isset($_SESSION['user_id'])) {
    $_SESSION['user_id'] = 1; // Default to alice
    $_SESSION['username'] = 'alice';
    $_SESSION['role'] = 'user';
    $_SESSION['access_level'] = 1;
}

$db = new PDO('sqlite:app.db');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Broken Access Control Lab</title>
    <style>
        body { background: #0a0e27; color: #00d9ff; font-family: 'Courier New', monospace; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #00d9ff; text-shadow: 0 0 10px #00d9ff; }
        .level { background: #1a1f3a; padding: 20px; margin: 20px 0; border-radius: 10px; border: 1px solid #00d9ff; }
        .level h2 { color: #ff3366; }
        input, button, select { background: #1a1f3a; color: #00d9ff; border: 1px solid #00d9ff; padding: 10px; margin: 5px; }
        button { cursor: pointer; }
        button:hover { background: #00d9ff; color: #0a0e27; }
        .hint { color: #ffaa00; font-size: 0.9em; margin-top: 10px; }
        .result { margin-top: 10px; padding: 15px; border-radius: 5px; background: #1a1f3a; border: 1px solid #00d9ff; }
        .success { border-color: #00ff00; color: #00ff00; }
        .error { border-color: #ff3366; color: #ff3366; }
        .user-info { background: #2a2f4a; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 10px; border: 1px solid #00d9ff; text-align: left; }
        th { background: #2a2f4a; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Broken Access Control Lab</h1>
        
        <div class="user-info">
            <strong>Current User:</strong> <?php echo $_SESSION['username']; ?> 
            (Role: <?php echo $_SESSION['role']; ?>, Access Level: <?php echo $_SESSION['access_level']; ?>)
            <br>
            <form method="POST" action="switch_user.php" style="display: inline;">
                <select name="user_id">
                    <option value="1">alice (user)</option>
                    <option value="2">bob (user)</option>
                    <option value="3">admin (admin)</option>
                    <option value="4">superadmin (superadmin)</option>
                </select>
                <button type="submit">Switch User</button>
            </form>
        </div>
        
        <div class="level">
            <h2>EASY: Insecure Direct Object Reference (IDOR)</h2>
            <p>Access documents by ID. Can you view documents belonging to other users?</p>
            
            <form method="GET" action="view_document.php">
                <input type="number" name="id" value="1" placeholder="Document ID">
                <button type="submit">View Document</button>
            </form>
            
            <div class="hint">Hint: Try accessing document IDs 1, 2, 3, 100. No authorization check!</div>
            
            <?php if (isset($_GET['doc_result'])): ?>
            <div class="result">
                <pre><?php echo htmlspecialchars($_GET['doc_result']); ?></pre>
            </div>
            <?php endif; ?>
        </div>
        
        <div class="level">
            <h2>MEDIUM: Privilege Escalation via Parameter Manipulation</h2>
            <p>Update your profile. Can you escalate your privileges?</p>
            
            <form method="POST" action="update_profile.php">
                <input type="text" name="username" value="<?php echo $_SESSION['username']; ?>" placeholder="Username">
                <input type="text" name="role" value="<?php echo $_SESSION['role']; ?>" placeholder="Role">
                <input type="number" name="access_level" value="<?php echo $_SESSION['access_level']; ?>" placeholder="Access Level">
                <button type="submit">Update Profile</button>
            </form>
            
            <div class="hint">Hint: Try modifying role to "admin" or access_level to 5 or higher</div>
            
            <?php if (isset($_GET['update_result'])): ?>
            <div class="result <?php echo $_GET['update_success'] == '1' ? 'success' : 'error'; ?>">
                <?php echo htmlspecialchars($_GET['update_result']); ?>
            </div>
            <?php endif; ?>
        </div>
        
        <div class="level">
            <h2>HARD: Race Condition in Authorization Check</h2>
            <p>Approve transfers. There's a race condition in the approval process.</p>
            
            <table>
                <tr>
                    <th>ID</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
                <?php
                $transfers = $db->query("SELECT * FROM transfers")->fetchAll(PDO::FETCH_ASSOC);
                foreach ($transfers as $transfer):
                ?>
                <tr>
                    <td><?php echo $transfer['id']; ?></td>
                    <td>User <?php echo $transfer['from_user']; ?></td>
                    <td>User <?php echo $transfer['to_user']; ?></td>
                    <td>$<?php echo $transfer['amount']; ?></td>
                    <td><?php echo $transfer['status']; ?></td>
                    <td>
                        <button onclick="approveTransfer(<?php echo $transfer['id']; ?>)">Approve</button>
                    </td>
                </tr>
                <?php endforeach; ?>
            </table>
            
            <div class="hint">Hint: Send multiple approval requests rapidly to exploit race condition</div>
            <div id="race-result" class="result" style="display:none;"></div>
        </div>
        
        <div class="level">
            <h2>IMPOSSIBLE: Multi-Layer Access Control Bypass</h2>
            <p>Access admin flags. Multiple layers of protection exist.</p>
            
            <form method="GET" action="get_flag.php">
                <select name="difficulty">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="impossible">Impossible</option>
                </select>
                <button type="submit">Get Flag</button>
            </form>
            
            <div class="hint">Hint: Combine IDOR, privilege escalation, and header manipulation</div>
            
            <?php if (isset($_GET['flag_result'])): ?>
            <div class="result <?php echo $_GET['flag_success'] == '1' ? 'success' : 'error'; ?>">
                <?php echo htmlspecialchars($_GET['flag_result']); ?>
            </div>
            <?php endif; ?>
        </div>
    </div>
    
    <script>
        async function approveTransfer(id) {
            const result = document.getElementById('race-result');
            result.style.display = 'block';
            result.innerHTML = 'Approving...';
            
            // Race condition: Send multiple requests
            const requests = [];
            for (let i = 0; i < 10; i++) {
                requests.push(
                    fetch('approve_transfer.php?id=' + id)
                        .then(r => r.text())
                );
            }
            
            const responses = await Promise.all(requests);
            result.innerHTML = responses.join('<br>');
        }
    </script>
</body>
</html>
