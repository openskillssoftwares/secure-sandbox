<?php
session_start();
$db = new PDO('sqlite:app.db');

$user_id = $_POST['user_id'] ?? 1;

// Switch to different user
$user = $db->query("SELECT * FROM users WHERE id = $user_id")->fetch(PDO::FETCH_ASSOC);

if ($user) {
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['access_level'] = $user['access_level'];
}

header("Location: index.php");
exit;
?>
