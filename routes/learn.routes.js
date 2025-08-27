const express = require('express');
const router = express.Router();
const learnController = require('../controllers/learn.controller');

router.post('/', learnController.createLog);
router.get('/all', learnController.getAllLogs);
router.get('/:userId', learnController.getLogsByUser);

module.exports = router;
