FROM node:18-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache sqlite

# Copy application files
COPY package.json .
COPY app.js .
COPY views/ ./views/
COPY public/ ./public/

# Install npm packages
RUN npm install

# Initialize database
RUN node -e "const db = require('better-sqlite3')('users.db'); \
    db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT, role TEXT, session_token TEXT, mfa_secret TEXT)'); \
    db.exec('INSERT INTO users VALUES (1, \"admin\", \"admin123\", \"admin\", null, null)'); \
    db.exec('INSERT INTO users VALUES (2, \"user1\", \"password123\", \"user\", null, null)'); \
    db.exec('INSERT INTO users VALUES (3, \"john\", \"john2023\", \"user\", null, null)'); \
    db.exec('INSERT INTO users VALUES (4, \"sarah\", \"Sarah@2023\", \"user\", null, null)'); \
    db.exec('INSERT INTO users VALUES (5, \"superadmin\", \"FLAG{w34k_p4ssw0rd_cr4ck3d}\", \"superadmin\", null, null)'); \
    db.exec('CREATE TABLE sessions (token TEXT PRIMARY KEY, user_id INTEGER, expires INTEGER)'); \
    db.exec('CREATE TABLE secrets (id INTEGER PRIMARY KEY, user_id INTEGER, flag TEXT, difficulty TEXT)'); \
    db.exec('INSERT INTO secrets VALUES (1, 5, \"FLAG{w34k_p4ssw0rd_cr4ck3d}\", \"easy\")'); \
    db.exec('INSERT INTO secrets VALUES (2, 1, \"FLAG{s3ss10n_h1j4ck3d}\", \"medium\")'); \
    db.exec('INSERT INTO secrets VALUES (3, 1, \"FLAG{jwt_f0rg3ry_m4st3r}\", \"hard\")'); \
    db.exec('INSERT INTO secrets VALUES (4, 1, \"FLAG{mult1_f4ct0r_byp4ss}\", \"impossible\")'); \
    db.close();"

EXPOSE 80

CMD ["node", "app.js"]
