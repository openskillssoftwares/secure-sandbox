<?php
session_start();
$db = new PDO('sqlite:app.db');

$difficulty = $_GET['difficulty'] ?? 'easy';

// Multiple layers of checks
$required_level = $db->query("SELECT required_level FROM admin_flags WHERE flag_name = '$difficulty'")->fetchColumn();

// Check 1: Access level
if ($_SESSION['access_level'] < $required_level) {
    $result = "❌ Access denied: Insufficient access level (need $required_level, have {$_SESSION['access_level']})";
    header("Location: index.php?flag_result=" . urlencode($result) . "&flag_success=0");
    exit;
}

// Check 2: Admin header (can be manipulated)
$admin_header = $_SERVER['HTTP_X_ADMIN_ACCESS'] ?? 'false';
if ($difficulty === 'impossible' && $admin_header !== 'true') {
    $result = "❌ Access denied: Missing X-Admin-Access header";
    header("Location: index.php?flag_result=" . urlencode($result) . "&flag_success=0");
    exit;
}

// Check 3: IP whitelist (can be bypassed with X-Forwarded-For)
$ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'];
if ($difficulty === 'impossible' && $ip !== '127.0.0.1') {
    $result = "❌ Access denied: Not from whitelisted IP (use X-Forwarded-For: 127.0.0.1)";
    header("Location: index.php?flag_result=" . urlencode($result) . "&flag_success=0");
    exit;
}

// Get flag
$flag = $db->query("SELECT flag_value FROM admin_flags WHERE flag_name = '$difficulty'")->fetchColumn();
$result = "✅ FLAG: $flag";

header("Location: index.php?flag_result=" . urlencode($result) . "&flag_success=1");
exit;
?>
