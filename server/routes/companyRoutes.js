const express = require('express');
const router = express.Router();
const { getCompany, updateCompany } = require('../controllers/companyController');
const { protect } = require('../middleware/authMiddleware');
const { checkPermission } = require('../config/permissions');

router.get('/', protect, getCompany);
router.put('/', protect, checkPermission('COMPANY_SETTINGS'), updateCompany);

module.exports = router;
