<?php
session_start();
$db = new PDO('sqlite:app.db');

$id = $_GET['id'] ?? 0;

// Vulnerable: Race condition in authorization check
$transfer = $db->query("SELECT * FROM transfers WHERE id = $id")->fetch(PDO::FETCH_ASSOC);

if (!$transfer) {
    echo "Transfer not found";
    exit;
}

// Check if user is admin (but race condition allows bypass)
if ($_SESSION['access_level'] < 5) {
    // Simulate delay in authorization check
    usleep(100000); // 0.1 second delay
    
    if ($_SESSION['access_level'] < 5) {
        echo "❌ Unauthorized";
        exit;
    }
}

// Approve transfer
if ($transfer['status'] === 'pending') {
    $db->exec("UPDATE transfers SET status = 'approved' WHERE id = $id");
    
    // If this is the special transfer, give hard flag
    if ($id == 1) {
        $flag = $db->query("SELECT flag_value FROM admin_flags WHERE flag_name = 'hard'")->fetchColumn();
        echo "✅ Transfer approved! FLAG: $flag";
    } else {
        echo "✅ Transfer approved";
    }
} else {
    echo "Transfer already processed";
}
?>
