const express = require('express');
const http = require('http');
const fileUpload = require('express-fileupload');
const { Server } = require("socket.io");

// YOUR LOCAL MODULES
const workflow = require('./workflow');
const injector = require('./injector');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(fileUpload());
app.use(express.static('public')); // For student upload page

// MEMORY DB (Resets on restart)
// Tracks the 6 States: 
// REVIEW_PENDING, REVIEW_ACCEPTED, REVIEW_REJECTED
// APPROVAL_PENDING, APPROVAL_ACCEPTED, APPROVAL_REJECTED
global.db = {}; 

// ==========================================
// 1. UPLOAD ROUTE (Student Submits File)
// ==========================================
app.post('/upload', async (req, res) => {
    try {
        if (!req.files || !req.files.document) return res.status(400).send('No file.');

        const file = req.files.document;
        const docId = `doc_${Date.now()}`;
        const content = file.data.toString('utf8');

        // 1. ASK WORKFLOW: Which Department? 
        // (Returns: 'scholarships', 'internships', 'admission', or 'certifications')
        const targetDept = workflow.determineDepartment(content); 

        console.log(`[SERVER] Received: ${file.name} -> Routing to: ${targetDept}`);

        // 2. SAVE TO DB (Initial Status: REVIEW_PENDING)
        global.db[docId] = {
            docId: docId,
            fileName: file.name,
            content: content,
            department: targetDept,
            status: 'REVIEW_PENDING',
            history: [`Uploaded at ${new Date().toLocaleTimeString()}`]
        };

        // 3. PUSH TO REDIS (The Reviewer Queue)
        // We push to the "Reviewer" queue of that specific department
        // Queue name example: "queue:scholarships:review"
        await injector.pushToQueue(`${targetDept}:review`, global.db[docId]);

        // 4. SIGNAL THE EXE (Silent Data Packet)
        // The Server sends a signal to the specific room (e.g., room_scholarships).
        // It says: "Type: REVIEW" so the EXE puts it in the Left Column.
        io.to(`room_${targetDept}`).emit('NEW_JOB', {
            type: 'REVIEW', 
            docId: docId,
            fileName: file.name,   // <--- ADDED
            content: content,
            message: `New document pending review.`
        });

        res.json({ success: true, docId: docId, department: targetDept });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// ==========================================
// 2. SOCKET HANDLING (Connection with EXEs)
// ==========================================
io.on('connection', (socket) => {
    
    // STEP A: The EXE connects and identifies itself
    // e.g., Scholarships.exe says "I am scholarships"
    socket.on('IDENTIFY_DEPT', (deptName) => {
        const roomName = `room_${deptName}`;
        socket.join(roomName);
        console.log(`[SOCKET] Department Connected: ${deptName}`);
    });

    // STEP B: The EXE sends a Decision (Reviewer Approved/Rejected)
    socket.on('PROCESS_DECISION', async (data) => {
        const { docId, department, role, action } = data;
        const doc = global.db[docId];

        if (!doc) return;

        console.log(`[DECISION] ${department} (${role}) -> ${action}`);

        // --- SCENARIO 1: REVIEWER DECIDES ---
        if (role === 'REVIEWER') {
            if (action === 'REJECT') {
                doc.status = 'REVIEW_REJECTED';
                // Update History
                doc.history.push('Rejected by Reviewer');
                // Signal EXE to update UI
                io.emit('STATUS_UPDATE', { docId, status: 'REVIEW_REJECTED' });
            } 
            else if (action === 'APPROVE') {
                // 1. Update Status
                doc.status = 'REVIEW_ACCEPTED';
                doc.history.push('Accepted by Reviewer');
                io.emit('STATUS_UPDATE', { docId, status: 'REVIEW_ACCEPTED' });

                // 2. AUTOMATIC HANDOFF TO ADMIN (The Magic Part)
                doc.status = 'APPROVAL_PENDING'; 
                
                // Push to Admin Queue in Redis (queue:scholarships:admin)
                await injector.pushToQueue(`${department}:admin`, doc);

                // Signal the SAME EXE to show it in the Right (Admin) Column
                io.to(`room_${department}`).emit('NEW_JOB', {
                    type: 'ADMIN',
                    docId: docId,
                    fileName: doc.fileName, // <--- ADDED
                    content: doc.content,
                    message: "Review passed. Ready for Admin."
                });
            }
        }

        // --- SCENARIO 2: ADMIN DECIDES ---
        else if (role === 'ADMIN') {
            if (action === 'REJECT') {
                doc.status = 'APPROVAL_REJECTED';
                doc.history.push('Rejected by Admin');
                io.emit('STATUS_UPDATE', { docId, status: 'APPROVAL_REJECTED' });
            } 
            else if (action === 'APPROVE') {
                doc.status = 'APPROVAL_ACCEPTED';
                doc.history.push('Approved by Admin');
                io.emit('STATUS_UPDATE', { docId, status: 'APPROVAL_ACCEPTED' });
            }
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`>> MASTER SERVER running on Port ${PORT}`);
});