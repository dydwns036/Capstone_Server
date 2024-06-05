const connection = require('../config/db');

exports.addComment = (req, res) => {
  const { userId, postId, commentContent } = req.body;

  if (!userId || !postId || !commentContent) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const query = `
    INSERT INTO comments (user_id, post_id, comment_content)
    VALUES (?, ?, ?)
  `;
  connection.query(query, [userId, postId, commentContent], (err) => {
    if (err) {
      console.error('Error adding comment:', err.stack);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.status(200).json({ message: 'Comment added successfully' });
  });
};

exports.deleteComment = (req, res) => {
  const commentId = req.params.commentId;
  const deleteCommentQuery = 'DELETE FROM comments WHERE comment_id = ?';

  connection.query(deleteCommentQuery, [commentId], (err, result) => {
    if (err) {
      console.error('Error deleting comment:', err.stack);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.status(200).json({ message: 'Comment deleted successfully' });
  });
};

exports.getCommentsByPostId = (req, res) => {
  const postId = req.params.post_id;
  const sql = `SELECT u.avatar_image, u.name, c.*
               FROM comments c
               INNER JOIN users u ON c.user_id = u.user_id
               WHERE c.post_id = ?
               ORDER BY c.created_at DESC;`;

  connection.query(sql, [postId], (err, result) => {
    if (err) {
      console.error('Error retrieving comments:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.status(200).json(result);
  });
};
