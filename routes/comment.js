const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

router.post('/addcomment', commentController.addComment);
router.delete('/deletecomments/:commentId', commentController.deleteComment);
router.get('/comments/:post_id', commentController.getCommentsByPostId);

module.exports = router;
