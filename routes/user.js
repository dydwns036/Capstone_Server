const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/login', userController.login);
router.get('/user/:account', userController.getUserByname);
router.post('/signup', userController.signup);
router.get('/users', userController.getAllUsers);
//router.post('/update', userController.updateUser);

module.exports = router;
