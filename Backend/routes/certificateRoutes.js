const express = require('express');
const {
  generateCertificate,
  getUserCertificates,
  getCertificateById
} = require('../controllers/certificateController');

const router = express.Router();

// Routes pour les certificats
router.post('/generate', generateCertificate);
router.get('/user/:userId', getUserCertificates);
router.get('/:certificateId', getCertificateById);

module.exports = router;
