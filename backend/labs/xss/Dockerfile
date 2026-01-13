FROM nginx:alpine

RUN apk add --no-cache \
    php81 \
    php81-fpm \
    php81-session

# Create XSS vulnerable application
COPY <<'EOF' /var/www/html/index.php
<?php
session_start();

$difficulty = getenv('DIFFICULTY') ?: 'easy';

// Initialize comments
if (!isset($_SESSION['comments'])) {
    $_SESSION['comments'] = [
        ['user' => 'Admin', 'text' => 'Welcome to the XSS lab!'],
        ['user' => 'Hacker', 'text' => 'Try to find the flag hidden in the cookie...']
    ];
    
    // Set flag in cookie for easy level
    if ($difficulty === 'easy') {
        setcookie('flag', 'FLAG{xss_r3fl3ct3d_b4s1c}', 0, '/');
    }
}

// Handle comment submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['comment'])) {
    $username = $_POST['username'] ?? 'Anonymous';
    $comment = $_POST['comment'];
    
    // INTENTIONALLY VULNERABLE - No sanitization!
    $_SESSION['comments'][] = [
        'user' => $username,
        'text' => $comment
    ];
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>XSS Lab - <?= $difficulty ?></title>
    <style>
        body {
            background: #0a0e27;
            color: #fff;
            font-family: Arial, sans-serif;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: #1a1f3a;
            padding: 30px;
            border-radius: 10px;
            border: 1px solid #1e3a8a;
        }
        .comment {
            background: #0a0e27;
            padding: 15px;
            margin: 10px 0;
            border-left: 4px solid #3b82f6;
        }
        .comment-user {
            color: #3b82f6;
            font-weight: bold;
        }
        input, textarea {
            background: #0a0e27;
            color: #fff;
            border: 1px solid #3b82f6;
            padding: 10px;
            width: 100%;
            margin: 10px 0;
            box-sizing: border-box;
        }
        button {
            background: #3b82f6;
            color: #fff;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            border-radius: 5px;
        }
        .hint {
            background: #7f1d1d;
            padding: 15px;
            margin: 20px 0;
            border-left: 4px solid #ef4444;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>💬 XSS Challenge - Comment Section</h1>
        <p>Difficulty: <strong><?= strtoupper($difficulty) ?></strong></p>
        
        <div class="hint">
            <strong>💡 Hint:</strong> Comments are displayed without sanitization. Try injecting JavaScript code!
            <?php if ($difficulty === 'easy'): ?>
            <br>The flag is stored in a cookie. Can you access it?
            <?php endif; ?>
        </div>
        
        <h3>Post a Comment:</h3>
        <form method="POST">
            <input type="text" name="username" placeholder="Your Name" required>
            <textarea name="comment" placeholder="Your comment..." rows="4" required></textarea>
            <button type="submit">Post Comment</button>
        </form>
        
        <h3>Comments:</h3>
        <?php foreach ($_SESSION['comments'] as $comment): ?>
            <div class="comment">
                <div class="comment-user"><?= $comment['user'] ?></div>
                <div><?= $comment['text'] ?></div>
            </div>
        <?php endforeach; ?>
        
        <h3>Objective:</h3>
        <p>Execute JavaScript code to retrieve the flag!</p>
    </div>
</body>
</html>
EOF

# Configure Nginx
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;
    root /var/www/html;
    index index.php;

    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
EOF

COPY <<'EOF' /docker-entrypoint.sh
#!/bin/sh
php-fpm81
nginx -g 'daemon off;'
EOF

RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

CMD ["/docker-entrypoint.sh"]
