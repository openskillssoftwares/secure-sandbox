<?php
session_start();
$db = new PDO('sqlite:app.db');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? $_SESSION['username'];
    $role = $_POST['role'] ?? $_SESSION['role'];
    $access_level = $_POST['access_level'] ?? $_SESSION['access_level'];
    
    // Vulnerable: Accepts any role/access_level from user input
    $stmt = $db->prepare("UPDATE users SET username = ?, role = ?, access_level = ? WHERE id = ?");
    $stmt->execute([$username, $role, $access_level, $_SESSION['user_id']]);
    
    $_SESSION['username'] = $username;
    $_SESSION['role'] = $role;
    $_SESSION['access_level'] = $access_level;
    
    $result = "Profile updated! New role: $role, Access level: $access_level";
    
    // Check if user can access medium flag
    if ($access_level >= 5) {
        $flag = $db->query("SELECT flag_value FROM admin_flags WHERE flag_name = 'medium'")->fetchColumn();
        $result .= "\n\n✅ FLAG: $flag";
        $success = 1;
    } else {
        $success = 0;
    }
    
    header("Location: index.php?update_result=" . urlencode($result) . "&update_success=$success");
    exit;
}
?>
