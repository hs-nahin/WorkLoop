const FileHandler = require('../utils/fileHandler');
const { protect } = require('../middleware/authMiddleware');

const companyStore = new FileHandler('company.json');

const getCompany = async (req, res) => {
    try {
        const data = await companyStore.read();
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const updateCompany = async (req, res) => {
    try {
        const updates = req.body;
        await companyStore.write(updates);
        res.json({ message: 'Company profile updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getCompany, updateCompany };
