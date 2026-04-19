const express = require('express');
const router = express.Router();
const { getCompany, updateCompany } = require('../controllers/companyController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getCompany);
router.put('/', protect, authorize('ADMIN'), updateCompany);

module.exports = router;
