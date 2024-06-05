const express = require('express');
const router = express.Router();
const multer = require('multer');
const postController = require('../controllers/postController');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

router.post('/createposts', upload.array('images', 10), postController.createPost);
router.delete('/deleteposts/:postId', postController.deletePost);
router.get('/post/:postId', postController.getPostById);
router.get('/allposts', postController.getAllPosts);
router.get('/popularposts', postController.getPopularPosts);

module.exports = router;
