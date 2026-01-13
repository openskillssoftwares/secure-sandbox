<?php
session_start();
$db = new PDO('sqlite:app.db');

$id = $_GET['id'] ?? 1;

// Vulnerable: No authorization check
$stmt = $db->prepare("SELECT * FROM documents WHERE id = ?");
$stmt->execute([$id]);
$doc = $stmt->fetch(PDO::FETCH_ASSOC);

if ($doc) {
    $result = "Document #{$doc['id']}: {$doc['title']}\n\n{$doc['content']}";
    
    if ($doc['is_private']) {
        $result .= "\n\n[PRIVATE DOCUMENT - Owner: User {$doc['owner_id']}]";
    }
} else {
    $result = "Document not found";
}

header("Location: index.php?doc_result=" . urlencode($result));
exit;
?>
