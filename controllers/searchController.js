const connection = require('../config/db');

exports.searchPosts = (req, res) => {
  const { groupId, searchText } = req.query;

  let query = `
    SELECT 
      users.avatar_image, 
      posts.*, 
      users.name, 
      GROUP_CONCAT(DISTINCT images.path ORDER BY images.image_id) AS imageUrls, 
      COUNT(DISTINCT likes.like_id) AS likeCount, 
      COUNT(DISTINCT comments.comment_id) AS commentCount 
    FROM 
      posts 
    JOIN 
      users ON posts.user_id = users.user_id 
    LEFT JOIN 
      images ON posts.post_id = images.post_id 
    LEFT JOIN 
      likes ON posts.post_id = likes.post_id 
    LEFT JOIN 
      comments ON posts.post_id = comments.post_id 
  `;

  let conditions = [];
  let params = [];

  if (groupId != 0) {
    conditions.push('posts.category = ?');
    params.push(groupId);
  }

  if (searchText) {
    conditions.push('(posts.title LIKE ? OR posts.content LIKE ?)');
    params.push(`%${searchText}%`, `%${searchText}%`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += `
    GROUP BY 
      posts.post_id, 
      users.avatar_image, 
      users.name 
    ORDER BY 
      posts.created_at DESC
  `;

  connection.query(query, params, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(200).json(results);
  });
};
