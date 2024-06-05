const express = require('express');
const router = express.Router();
const likeController = require('../controllers/likeController');

router.post('/likepost', likeController.likePost);

module.exports = router;
