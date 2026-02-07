// workflow.js

module.exports = {
    /**
     * DECISION LOGIC:
     * Reads the file content and assigns it to a Department.
     * @param {string} fileContent - The text inside the uploaded .txt file
     * @returns {string} - 'scholarships', 'internships', 'admission', or 'certifications'
     */
    determineDepartment: (fileContent) => {
        
        // Convert to lowercase to make matching easier
        const text = fileContent.toLowerCase();

        // 1. SCHOLARSHIPS DEPARTMENT
        if (text.includes('money') || 
            text.includes('grant') || 
            text.includes('financial') || 
            text.includes('scholarship')) {
            return 'scholarships';
        }

        // 2. INTERNSHIPS DEPARTMENT
        if (text.includes('job') || 
            text.includes('intern') || 
            text.includes('summer') || 
            text.includes('work')) {
            return 'internships';
        }

        // 3. CERTIFICATIONS DEPARTMENT
        if (text.includes('certificate') || 
            text.includes('course') || 
            text.includes('completion') || 
            text.includes('exam')) {
            return 'certifications';
        }

        // 4. ADMISSION DEPARTMENT (Default)
        // If it talks about enrollment or if we are unsure, send to Admission.
        if (text.includes('enroll') || 
            text.includes('seat') || 
            text.includes('admission')) {
            return 'admission';
        }

        return 'admission'; // Fallback
    }
};