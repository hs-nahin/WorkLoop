const admin = require('../firebase-admin');

const getCompany = async (req, res) => {
    try {
        const db = admin.firestore();
        const companyDoc = await db.collection('company').doc('profile').get();
        
        if (!companyDoc.exists) {
            // Return default if not exists
            return res.json({
                name: "WorkLoop IT Department",
                address: "Corporate HQ",
                contact: "it-support@company.com"
            });
        }
        
        res.json(companyDoc.data());
    } catch (error) {
        console.error('Error fetching company:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateCompany = async (req, res) => {
    try {
        const updates = req.body;
        const db = admin.firestore();
        
        await db.collection('company').doc('profile').set(updates, { merge: true });
        res.json({ message: 'Company profile updated successfully' });
    } catch (error) {
        console.error('Error updating company:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getCompany, updateCompany };
