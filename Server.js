const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const DATA_FILE = path.join(__dirname, 'data', 'accounts.json');

if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// ============================================================
// FUNGSI
// ============================================================

function readAccounts() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch {
        return [];
    }
}

function writeAccounts(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ============================================================
// API
// ============================================================

app.get('/api/accounts', (req, res) => {
    res.json(readAccounts());
});

app.post('/api/register', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    if (!email.includes('@') || !email.includes('.')) {
        return res.status(400).json({ error: 'Email tidak valid!' });
    }

    const accounts = readAccounts();
    if (accounts.some(a => a.email === email)) {
        return res.status(400).json({ error: 'Email sudah terdaftar!' });
    }

    accounts.push({
        id: accounts.length + 1,
        email,
        password,
        status: 'active',
        banReason: ''
    });

    writeAccounts(accounts);
    res.json({ success: true, account: { email, status: 'active' } });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    if (email === 'kimzadmin1@gmail.com' && password === 'kimzadmin') {
        return res.json({ success: true, role: 'admin', username: 'Admin' });
    }

    const accounts = readAccounts();
    const user = accounts.find(a => a.email === email && a.password === password);

    if (user) {
        if (user.status === 'banned') {
            return res.status(403).json({ error: 'Akun Anda di-ban!', banned: true, reason: user.banReason });
        }
        return res.json({ success: true, role: 'user', username: email.split('@')[0] });
    }

    return res.status(400).json({ error: 'Email atau password salah!' });
});

app.post('/api/ban', (req, res) => {
    const { email, reason } = req.body;

    if (!email || !reason) {
        return res.status(400).json({ error: 'Email dan alasan wajib diisi' });
    }

    const accounts = readAccounts();
    const user = accounts.find(a => a.email === email);

    if (!user) {
        return res.status(404).json({ error: 'Akun tidak ditemukan' });
    }

    user.status = 'banned';
    user.banReason = reason;
    writeAccounts(accounts);

    res.json({ success: true });
});

app.post('/api/unban', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email wajib diisi' });
    }

    const accounts = readAccounts();
    const user = accounts.find(a => a.email === email);

    if (!user) {
        return res.status(404).json({ error: 'Akun tidak ditemukan' });
    }

    user.status = 'active';
    user.banReason = '';
    writeAccounts(accounts);

    res.json({ success: true });
});

app.post('/api/delete', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email wajib diisi' });
    }

    let accounts = readAccounts();
    const filtered = accounts.filter(a => a.email !== email);

    if (filtered.length === accounts.length) {
        return res.status(404).json({ error: 'Akun tidak ditemukan' });
    }

    writeAccounts(filtered);
    res.json({ success: true });
});

app.get('/api/status', (req, res) => {
    res.json({ status: 'online', version: '1.0.0', admin: 'kimzadmin1@gmail.com' });
});

// ============================================================
// START
// ============================================================

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  📊 ADMIN DASHBOARD SERVER                                  ║
║  ~TUAN NICO~ EDITION - ONLINE 🔥                           ║
╚═══════════════════════════════════════════════════════════════╝

[+] Server running on port ${PORT}
[+] Admin: kimzadmin1@gmail.com / kimzadmin
[+] Status: RUNNING
    `);
});
