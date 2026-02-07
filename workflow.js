// workflow.js
const natural = require('natural');
const classifier = new natural.BayesClassifier();

// ==========================================
// 1. TRAIN THE BRAIN (Teach it examples)
// ==========================================

// Teach it about SCHOLARSHIPS
classifier.addDocument('I need money for tuition', 'scholarships');
classifier.addDocument('financial aid application', 'scholarships');
classifier.addDocument('grant for struggling students', 'scholarships');
classifier.addDocument('can I get a stipend for my fees', 'scholarships');
classifier.addDocument('support for my education costs', 'scholarships');
classifier.addDocument('I am broke and need help', 'scholarships');
classifier.addDocument('tuition waiver request', 'scholarships');
classifier.addDocument('can the college pay for my books', 'scholarships');
classifier.addDocument('economic hardship assistance', 'scholarships');
classifier.addDocument('need cash for my semester fees', 'scholarships');

// Teach it about INTERNSHIPS
classifier.addDocument('looking for a job', 'internships');
classifier.addDocument('summer internship opportunity', 'internships');
classifier.addDocument('I want to work at a company', 'internships');
classifier.addDocument('hiring for junior positions', 'internships');
classifier.addDocument('employment application', 'internships');
classifier.addDocument('looking for work experience', 'internships');
classifier.addDocument('placement drive registration', 'internships');
classifier.addDocument('cv submission for summer role', 'internships');
classifier.addDocument('training program for freshers', 'internships');
classifier.addDocument('apprentice position application', 'internships');

// Teach it about ADMISSION
classifier.addDocument('I want to join this college', 'admission');
classifier.addDocument('application for enrollment', 'admission');
classifier.addDocument('book a seat in the course', 'admission');
classifier.addDocument('when does the semester start', 'admission');
classifier.addDocument('admission process details', 'admission');
classifier.addDocument('entrance exam results', 'admission');
classifier.addDocument('registration for next batch', 'admission');
classifier.addDocument('counselling date inquiry', 'admission');
classifier.addDocument('lateral entry process', 'admission');
classifier.addDocument('hostel allocation for new students', 'admission');

// Teach it about CERTIFICATIONS
classifier.addDocument('I want to learn a new skill', 'certifications');
classifier.addDocument('course completion certificate', 'certifications');
classifier.addDocument('online exam for diploma', 'certifications');
classifier.addDocument('degree verification', 'certifications');
classifier.addDocument('mark sheet correction', 'certifications');
classifier.addDocument('provisional certificate request', 'certifications');
classifier.addDocument('transcript application', 'certifications');
classifier.addDocument('bonafide certificate for loan', 'certifications');
classifier.addDocument('character certificate issuance', 'certifications');

// FINALIZE TRAINING
classifier.train(); 

// ==========================================
// 2. EXPORT THE LOGIC
// ==========================================
module.exports = {
    determineDepartment: (text) => {
        // The classifier predicts the category based on the training above
        const category = classifier.classify(text);
        
        // Return the best guess
        console.log(`[AI PREDICTION] "${text.substring(0, 20)}..." -> ${category.toUpperCase()}`);
        return category;
    }
};