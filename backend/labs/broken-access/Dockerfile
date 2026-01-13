FROM php:8.1-apache

WORKDIR /var/www/html

# Install dependencies
RUN apt-get update && apt-get install -y sqlite3 libsqlite3-dev && rm -rf /var/lib/apt/lists/*
RUN docker-php-ext-install pdo pdo_sqlite

# Copy application files
COPY . /var/www/html/

# Initialize database
RUN php -r "\$db = new PDO('sqlite:app.db'); \
    \$db->exec('CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, role TEXT, access_level INTEGER)'); \
    \$db->exec('INSERT INTO users VALUES (1, \"alice\", \"user\", 1)'); \
    \$db->exec('INSERT INTO users VALUES (2, \"bob\", \"user\", 1)'); \
    \$db->exec('INSERT INTO users VALUES (3, \"admin\", \"admin\", 5)'); \
    \$db->exec('INSERT INTO users VALUES (4, \"superadmin\", \"superadmin\", 10)'); \
    \$db->exec('CREATE TABLE documents (id INTEGER PRIMARY KEY, owner_id INTEGER, title TEXT, content TEXT, is_private BOOLEAN)'); \
    \$db->exec('INSERT INTO documents VALUES (1, 1, \"Alice Personal\", \"Private notes\", 1)'); \
    \$db->exec('INSERT INTO documents VALUES (2, 2, \"Bob Personal\", \"Confidential data\", 1)'); \
    \$db->exec('INSERT INTO documents VALUES (3, 3, \"Admin Panel\", \"FLAG{1d0r_vuln3r4b1l1ty}\", 1)'); \
    \$db->exec('INSERT INTO documents VALUES (100, 4, \"Super Secret\", \"FLAG{pr1v_3sc4l4t10n}\", 1)'); \
    \$db->exec('CREATE TABLE transfers (id INTEGER PRIMARY KEY, from_user INTEGER, to_user INTEGER, amount REAL, status TEXT)'); \
    \$db->exec('INSERT INTO transfers VALUES (1, 1, 2, 100.0, \"pending\")'); \
    \$db->exec('INSERT INTO transfers VALUES (2, 2, 3, 250.0, \"completed\")'); \
    \$db->exec('CREATE TABLE admin_flags (id INTEGER PRIMARY KEY, flag_name TEXT, flag_value TEXT, required_level INTEGER)'); \
    \$db->exec('INSERT INTO admin_flags VALUES (1, \"easy\", \"FLAG{1d0r_vuln3r4b1l1ty}\", 3)'); \
    \$db->exec('INSERT INTO admin_flags VALUES (2, \"medium\", \"FLAG{pr1v_3sc4l4t10n}\", 5)'); \
    \$db->exec('INSERT INTO admin_flags VALUES (3, \"hard\", \"FLAG{r4c3_c0nd1t10n_4cc3ss}\", 8)'); \
    \$db->exec('INSERT INTO admin_flags VALUES (4, \"impossible\", \"FLAG{mult1_l4y3r_byp4ss}\", 10)'); \
    "

RUN chmod 666 /var/www/html/app.db
RUN chown www-data:www-data /var/www/html/app.db

EXPOSE 80

CMD ["apache2-foreground"]
