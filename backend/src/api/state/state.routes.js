const express = require('express');
const router = express.Router();
const stateController = require('./state.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');

// Routes protégées par l'authentification
router.get('/', authMiddleware, stateController.getUserState);
router.post('/update-from-sdk', authMiddleware, stateController.updateStateFromSdk);

module.exports = router;
