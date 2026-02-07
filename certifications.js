const express = require('express');
const io = require('socket.io-client');
// REMOVED: const open = require('open'); <--- Safe Mode
const app = express();

// ==========================================
// 🚨 CONFIGURATION (SPECIFIC TO THIS DEPT)
// ==========================================
const MY_DEPARTMENT = 'certifications'; 
const MY_PORT = 4004; // Port 4004 for Certifications

// CONNECT TO MASTER SERVER
const socket = io('http://localhost:3000');

// LOCAL STORAGE
let reviewQueue = [];
let adminQueue = [];

// ==========================================
// 1. THE DASHBOARD UI
// ==========================================
app.get('/', (req, res) => {
    let html = `
    <html>
        <head>
            <title>Certifications Dept</title>
            <meta http-equiv="refresh" content="2"> 
            <style>
                body { font-family: sans-serif; padding: 20px; background: #f4f4f4; }
                .container { display: flex; gap: 20px; }
                .col { flex: 1; background: white; padding: 15px; border-radius: 8px; }
                .reviewer-col { border-top: 5px solid #ff9800; }
                .admin-col { border-top: 5px solid #4caf50; }
                .card { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; background: #fafafa; }
                .btn { padding: 5px 10px; cursor: pointer; color: white; border: none; margin-right: 5px; }
                .approve { background: green; } .reject { background: red; }
            </style>
        </head>
        <body>
            <h1>📜 ${MY_DEPARTMENT.toUpperCase()} PORTAL</h1>
            <div class="container">
                <div class="col reviewer-col">
                    <h2>🧐 Reviewer Queue</h2>
                    ${reviewQueue.map(doc => `
                        <div class="card">
                            <h3>📄 ${doc.fileName}</h3>
                            <p><b>Content:</b> "${doc.content}"</p>
                            <button class="btn approve" onclick="act('${doc.docId}', 'REVIEWER', 'APPROVE')">✅ Pass</button>
                            <button class="btn reject" onclick="act('${doc.docId}', 'REVIEWER', 'REJECT')">❌ Reject</button>
                        </div>
                    `).join('')}
                </div>
                <div class="col admin-col">
                    <h2>🛡️ Admin Queue</h2>
                    ${adminQueue.map(doc => `
                        <div class="card">
                            <h3>📄 ${doc.fileName}</h3>
                            <p><b>Content:</b> "${doc.content}"</p>
                            <button class="btn approve" onclick="act('${doc.docId}', 'ADMIN', 'APPROVE')">✅ Approve</button>
                            <button class="btn reject" onclick="act('${doc.docId}', 'ADMIN', 'REJECT')">❌ Reject</button>
                        </div>
                    `).join('')}
                </div>
            </div>
            <script src="/socket.io/socket.io.js"></script>
            <script>
                function act(id, role, action) {
                    fetch('/decide?id=' + id + '&role=' + role + '&action=' + action);
                    setTimeout(() => window.location.reload(), 200);
                }
            </script>
        </body>
    </html>
    `;
    res.send(html);
});

// ==========================================
// 2. HANDLE CLICKS
// ==========================================
app.get('/decide', (req, res) => {
    const { id, role, action } = req.query;
    socket.emit('PROCESS_DECISION', { docId: id, department: MY_DEPARTMENT, role, action });
    
    if (role === 'REVIEWER') reviewQueue = reviewQueue.filter(d => d.docId !== id);
    else adminQueue = adminQueue.filter(d => d.docId !== id);
    res.send('OK');
});

// ==========================================
// 3. SOCKET LISTENERS
// ==========================================
socket.on('connect', () => {
    console.log(`[SOCKET] Connected to Master Server!`);
    socket.emit('IDENTIFY_DEPT', MY_DEPARTMENT);
});

socket.on('NEW_JOB', (data) => {
    console.log('🔔 NEW NOTIFICATION:', data.message);
    if (data.type === 'REVIEW') reviewQueue.push(data); 
    else if (data.type === 'ADMIN') adminQueue.push(data);
});

// ==========================================
// 4. START LOCAL APP
// ==========================================
app.listen(MY_PORT, () => {
    console.log(`\n✅ SUCCESS! ${MY_DEPARTMENT.toUpperCase()} is running.`);
    console.log(`👉 OPEN YOUR BROWSER MANUALLY: http://localhost:${MY_PORT}\n`);
});