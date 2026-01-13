FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache sqlite

COPY package.json .
COPY app.js .

RUN npm install

# Initialize database
RUN node -e "const db = require('better-sqlite3')('bank.db'); \
    db.exec('CREATE TABLE accounts (id INTEGER PRIMARY KEY, account_number TEXT UNIQUE, owner TEXT, balance REAL, pin TEXT)'); \
    db.exec('INSERT INTO accounts VALUES (1, \"1001\", \"Alice\", 5000.00, \"1234\")'); \
    db.exec('INSERT INTO accounts VALUES (2, \"1002\", \"Bob\", 3000.00, \"5678\")'); \
    db.exec('INSERT INTO accounts VALUES (3, \"1003\", \"Admin\", 100000.00, \"0000\")'); \
    db.exec('INSERT INTO accounts VALUES (999, \"9999\", \"FLAG_ACCOUNT\", 999999.99, \"FLAG{4cc0unt_3num3r4t10n}\")'); \
    db.exec('CREATE TABLE transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, from_account TEXT, to_account TEXT, amount REAL, status TEXT, timestamp INTEGER)'); \
    db.exec('CREATE TABLE admin_logs (id INTEGER PRIMARY KEY, action TEXT, flag TEXT)'); \
    db.exec('INSERT INTO admin_logs VALUES (1, \"system_backup\", \"FLAG{tr4ns4ct10n_m4n1pul4t10n}\")'); \
    db.exec('INSERT INTO admin_logs VALUES (2, \"security_audit\", \"FLAG{r4c3_c0nd1t10n_tr4nsf3r}\")'); \
    db.exec('INSERT INTO admin_logs VALUES (3, \"full_access\", \"FLAG{full_b4nk_t4k30v3r}\")'); \
    db.close();"

EXPOSE 80

CMD ["node", "app.js"]
