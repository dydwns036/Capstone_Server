const connection = require('../config/db');

exports.likePost = (req, res) => {
  const { userId, postId } = req.body;
  if (!userId || !postId) {
    return res.status(400).json({ error: 'Missing userId or postId' });
  }

  const checkQuery = 'SELECT * FROM likes WHERE user_id = ? AND post_id = ?';
  connection.query(checkQuery, [userId, postId], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error checking like:', checkErr.stack);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (checkResults.length > 0) {
      unlikePost(userId, postId, res);
    } else {
      likePost(userId, postId, res);
    }
  });
};

const likePost = (userId, postId, res) => {
  const likeQuery = 'INSERT INTO likes (user_id, post_id) VALUES (?, ?)';
  connection.query(likeQuery, [userId, postId], (likeErr) => {
    if (likeErr) {
      console.error('Error liking post:', likeErr.stack);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(200).json({ message: 'Post liked successfully' });
  });
};

const unlikePost = (userId, postId, res) => {
  const unlikeQuery = 'DELETE FROM likes WHERE user_id = ? AND post_id = ?';
  connection.query(unlikeQuery, [userId, postId], (unlikeErr) => {
    if (unlikeErr) {
      console.error('Error unliking post:', unlikeErr.stack);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(200).json({ message: 'Post unliked successfully' });
  });
};
