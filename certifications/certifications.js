const express = require('express');
const io = require('socket.io-client');
const cookieParser = require('cookie-parser'); 
const app = express();

// ==========================================
// 🚨 CONFIGURATION (SPECIFIC TO CERTIFICATIONS)
// ==========================================
const MY_DEPARTMENT = 'certifications'; 
const MY_PORT = 4004; 

// --- ROLE-SPECIFIC PASSKEYS ---
const ROLE_KEYS = {
    'RCERTIFICATION': 'REVIEWER',     // Unlocks Reviewer tools
    'ACERTIFICATION': 'ADMIN'         // Unlocks Admin tools
};

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// CONNECT TO MASTER SERVER
const socket = io('http://localhost:3000');

let reviewQueue = [];
let adminQueue = [];

// ==========================================
// 1. LOGIN SYSTEM
// ==========================================
app.get('/login', (req, res) => {
    res.send(`
        <body style="font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh; background:#1a1a1a; color:white; margin:0;">
            <form action="/login" method="POST" style="background:#2d2d2d; padding:40px; border-radius:12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); width:320px; text-align:center;">
                <h1 style="color:#9b59b6; margin-bottom:10px;">📜 DEPT PORTAL</h1>
                <p style="color:#aaa; font-size:14px; margin-bottom:25px;">Enter Certifications Role Key</p>
                
                <input type="password" name="passkey" placeholder="Enter Key..." 
                       style="padding:12px; width:100%; border-radius:6px; border:1px solid #444; background:#1a1a1a; color:white; margin-bottom:15px; box-sizing:border-box;" required>
                
                <button type="submit" style="padding:12px; background:#9b59b6; color:white; border:none; border-radius:6px; cursor:pointer; width:100%; font-weight:bold; font-size:16px;">
                    ACCESS PORTAL
                </button>
            </form>
        </body>
    `);
});

app.post('/login', (req, res) => {
    const role = ROLE_KEYS[req.body.passkey];
    if (role) {
        res.cookie('userRole', role);
        return res.redirect('/');
    }
    res.send("<script>alert('Invalid Certifications Key'); window.location='/login';</script>");
});

// ==========================================
// 2. THE SECURE PORTAL
// ==========================================
app.get('/', (req, res) => {
    const role = req.cookies.userRole;
    if (!role) return res.redirect('/login');

    let html = `
    <html>
        <head>
            <title>${MY_DEPARTMENT.toUpperCase()} - Control Panel</title>
            <meta http-equiv="refresh" content="5"> 
            <style>
                body { font-family: 'Segoe UI', sans-serif; padding: 30px; background: #f0f2f5; color: #1c1e21; margin: 0; }
                .nav { background: #fff; padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: -30px -30px 30px -30px; }
                .status-badge { padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
                .role-reviewer { background: #fff3e0; color: #e65100; border: 1px solid #ffb74d; }
                .role-admin { background: #e8f5e9; color: #1b5e20; border: 1px solid #81c784; }
                
                .container { display: flex; gap: 25px; }
                .col { flex: 1; background: #fff; padding: 20px; border-radius: 10px; border: 1px solid #ddd; min-height: 400px; }
                .locked { opacity: 0.5; background: #fafafa; pointer-events: none; position: relative; }
                .locked::after { content: "🔒 SECURE SECTION"; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-weight: bold; color: #999; font-size: 18px; }

                .card { border: 1px solid #e1e4e8; padding: 15px; margin-bottom: 15px; border-radius: 8px; background: #fff; transition: transform 0.2s; }
                .card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                .btn { padding: 8px 16px; cursor: pointer; color: white; border: none; border-radius: 4px; font-weight: 600; margin-right: 8px; }
                .approve { background: #28a745; } .reject { background: #dc3545; }
                .logout { text-decoration: none; color: #d93025; font-weight: bold; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="nav">
                <div>
                    <h2 style="margin:0;">📜 ${MY_DEPARTMENT.toUpperCase()} PORTAL</h2>
                    <span class="status-badge role-${role.toLowerCase()}">
                        Access Level: ${role}
                    </span>
                </div>
                <a href="/logout" class="logout">EXIT PORTAL</a>
            </div>
            
            <div class="container">
                <div class="col ${role === 'REVIEWER' ? '' : 'locked'}">
                    <h2 style="color:#e65100;">🧐 Reviewer Queue</h2>
                    ${reviewQueue.length === 0 ? '<p>No certification requests waiting.</p>' : reviewQueue.map(doc => `
                        <div class="card">
                            <h3 style="margin-top:0;">📄 ${doc.fileName}</h3>
                            <pre style="background:#f8f9fa; padding:10px; border-radius:5px; font-size:12px; white-space:pre-wrap;">${doc.content}</pre>
                            <button class="btn approve" onclick="act('${doc.docId}', 'REVIEWER', 'APPROVE')">PASS TO ADMIN</button>
                            <button class="btn reject" onclick="act('${doc.docId}', 'REVIEWER', 'REJECT')">REJECT</button>
                        </div>
                    `).join('')}
                </div>

                <div class="col ${role === 'ADMIN' ? '' : 'locked'}">
                    <h2 style="color:#1b5e20;">🛡️ Admin Queue</h2>
                    ${adminQueue.length === 0 ? '<p>No certification requests waiting.</p>' : adminQueue.map(doc => `
                        <div class="card">
                            <h3 style="margin-top:0;">📄 ${doc.fileName}</h3>
                            <pre style="background:#f8f9fa; padding:10px; border-radius:5px; font-size:12px; white-space:pre-wrap;">${doc.content}</pre>
                            <button class="btn approve" onclick="act('${doc.docId}', 'ADMIN', 'APPROVE')">FINAL APPROVAL</button>
                            <button class="btn reject" onclick="act('${doc.docId}', 'ADMIN', 'REJECT')">FINAL REJECT</button>
                        </div>
                    `).join('')}
                </div>
            </div>

            <script>
                function act(id, role, action) {
                    fetch('/decide?id=' + id + '&role=' + role + '&action=' + action)
                        .then(() => setTimeout(() => window.location.reload(), 200));
                }
            </script>
        </body>
    </html>
    `;
    res.send(html);
});

// ==========================================
// 3. API & UTILITIES
// ==========================================
app.get('/logout', (req, res) => {
    res.clearCookie('userRole');
    res.redirect('/login');
});

app.get('/decide', (req, res) => {
    const { id, role, action } = req.query;
    
    if (req.cookies.userRole !== role) {
        return res.status(403).send('ERROR: Unauthorized Role.');
    }

    socket.emit('PROCESS_DECISION', { docId: id, department: MY_DEPARTMENT, role, action });
    
    if (role === 'REVIEWER') reviewQueue = reviewQueue.filter(d => d.docId !== id);
    else adminQueue = adminQueue.filter(d => d.docId !== id);
    res.send('OK');
});

socket.on('connect', () => {
    console.log(`[SOCKET] Connected to Master Server!`);
    socket.emit('IDENTIFY_DEPT', MY_DEPARTMENT);
});

socket.on('NEW_JOB', (data) => {
    console.log('🔔 NEW NOTIFICATION:', data.message);
    if (data.type === 'REVIEW') reviewQueue.push(data); 
    else if (data.type === 'ADMIN') adminQueue.push(data);
});

app.listen(MY_PORT, () => {
    console.log(`\n==============================================`);
    console.log(`✅ ${MY_DEPARTMENT.toUpperCase()} PORTAL ONLINE`);
    console.log(`👉 ACCESS LINK: http://localhost:${MY_PORT}`);
    console.log(`Reviewer Key:   RCERTIFICATION`);
    console.log(`Admin Key:      ACERTIFICATION`);
    console.log(`==============================================\n`);
});