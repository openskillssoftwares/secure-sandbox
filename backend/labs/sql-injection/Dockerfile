FROM nginx:alpine

# Install PHP and required modules
RUN apk add --no-cache \
    php81 \
    php81-fpm \
    php81-mysqli \
    php81-json \
    php81-session \
    mysql \
    mysql-client

# Create vulnerable PHP application
RUN mkdir -p /var/www/html

# Copy vulnerable SQL injection lab files
COPY <<'EOF' /var/www/html/index.php
<?php
session_start();

// INTENTIONALLY VULNERABLE - DO NOT USE IN PRODUCTION
// This is for educational purposes only

$difficulty = getenv('DIFFICULTY') ?: 'easy';

// Easy: Direct SQL injection with visible error messages
if ($difficulty === 'easy') {
    $host = 'localhost';
    $user = 'root';
    $pass = '';
    $db = 'vuln_db_easy';
    
    $conn = mysqli_connect($host, $user, $pass, $db);
    
    if (isset($_GET['id'])) {
        $id = $_GET['id']; // No sanitization!
        $query = "SELECT * FROM users WHERE id = $id";
        $result = mysqli_query($conn, $query);
        
        if ($result) {
            while ($row = mysqli_fetch_assoc($result)) {
                echo "<h2>User Details</h2>";
                echo "Username: " . $row['username'] . "<br>";
                echo "Email: " . $row['email'] . "<br>";
                if ($row['hidden'] == true) {
                    echo "<p style='color: green;'>FLAG: " . $row['flag'] . "</p>";
                }
            }
        } else {
            echo "Error: " . mysqli_error($conn); // Visible errors!
        }
    }
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>SQL Injection Lab - <?= $difficulty ?></title>
    <style>
        body {
            background: #0a0e27;
            color: #fff;
            font-family: 'Courier New', monospace;
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
        input {
            background: #0a0e27;
            color: #fff;
            border: 1px solid #3b82f6;
            padding: 10px;
            width: 300px;
            margin: 10px 0;
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
        <h1>🔓 SQL Injection Challenge</h1>
        <p>Difficulty: <strong><?= strtoupper($difficulty) ?></strong></p>
        
        <form method="GET">
            <label>Enter User ID:</label><br>
            <input type="text" name="id" placeholder="1" value="<?= $_GET['id'] ?? '' ?>">
            <button type="submit">Search</button>
        </form>
        
        <div class="hint">
            <strong>💡 Hint:</strong> Try entering different values. Some data might be hidden...
        </div>
        
        <h3>Objective:</h3>
        <p>Find the hidden flag in the database!</p>
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
    index index.php index.html;

    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
EOF

# Initialize database
COPY <<'EOF' /docker-entrypoint.sh
#!/bin/sh
set -e

# Start MySQL
mysqld_safe --datadir='/var/lib/mysql' &

sleep 5

# Create database and tables
mysql -e "CREATE DATABASE IF NOT EXISTS vuln_db_easy;"
mysql -e "USE vuln_db_easy; CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY,
    username VARCHAR(100),
    email VARCHAR(255),
    password VARCHAR(255),
    hidden BOOLEAN DEFAULT FALSE,
    flag VARCHAR(255)
);"

mysql -e "USE vuln_db_easy; INSERT INTO users VALUES 
    (1, 'admin', 'admin@example.com', 'admin123', FALSE, NULL),
    (2, 'john', 'john@example.com', 'password', FALSE, NULL),
    (3, 'hidden_user', 'secret@example.com', 'secret', TRUE, 'FLAG{sql_1nj3ct10n_b4s1c}');"

# Start PHP-FPM
php-fpm81

# Start Nginx
nginx -g 'daemon off;'
EOF

RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

CMD ["/docker-entrypoint.sh"]
