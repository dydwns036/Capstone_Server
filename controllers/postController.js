const connection = require('../config/db');

  exports.createPost = (req, res) => {
    const { post_title, post_content, isRecipe, user_id, post_group } = req.body;
    const imageUrls = req.files.map(file => `http://172.16.3.154:3000/uploads/${file.filename}`);

    const query = 'INSERT INTO posts (category, is_recipe, user_id, title, content) VALUES (?, ?, ?, ?, ?)';
    connection.query(query, [post_group, isRecipe, user_id, post_title, post_content], (error, results) => {
      if (error) {
        console.error('Error creating post:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      const post_id = results.insertId;
      imageUrls.forEach(imageUrl => {
        connection.query('INSERT INTO images (post_id, path) VALUES (?, ?)', [post_id, imageUrl], (error) => {
          if (error) {
            console.error('Error saving post images:', error);
            return res.status(500).json({ error: 'Internal server error' });
          }
        });
      });

      res.status(201).json({ message: 'Post created successfully' });
    });
  };

exports.deletePost = (req, res) => {
  const postId = req.params.postId;

  connection.query('SELECT * FROM posts WHERE post_id = ?', [postId], (selectErr, selectResults) => {
    if (selectErr) {
      console.error('Error checking post existence:', selectErr);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (selectResults.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    connection.beginTransaction((beginTransactionErr) => {
      if (beginTransactionErr) {
        console.error('Error starting transaction:', beginTransactionErr);
        return res.status(500).json({ error: 'Internal server error' });
      }

      connection.query('DELETE FROM images WHERE post_id = ?', [postId], (deletePhotosErr) => {
        if (deletePhotosErr) {
          connection.rollback(() => {
            console.error('Error deleting post images:', deletePhotosErr);
            return res.status(500).json({ error: 'Internal server error' });
          });
        }

        connection.query('DELETE FROM comments WHERE post_id = ?', [postId], (deleteCommentsErr) => {
          if (deleteCommentsErr) {
            connection.rollback(() => {
              console.error('Error deleting post comments:', deleteCommentsErr);
              return res.status(500).json({ error: 'Internal server error' });
            });
          }

          connection.query('DELETE FROM likes WHERE post_id = ?', [postId], (deleteLikesErr) => {
            if (deleteLikesErr) {
              connection.rollback(() => {
                console.error('Error deleting post likes:', deleteLikesErr);
                return res.status(500).json({ error: 'Internal server error' });
              });
            }

            connection.query('DELETE FROM posts WHERE post_id = ?', [postId], (deletePostErr) => {
              if (deletePostErr) {
                connection.rollback(() => {
                  console.error('Error deleting post:', deletePostErr);
                  return res.status(500).json({ error: 'Internal server error' });
                });
              }

              connection.commit((commitErr) => {
                if (commitErr) {
                  connection.rollback(() => {
                    console.error('Error committing transaction:', commitErr);
                    return res.status(500).json({ error: 'Internal server error' });
                  });
                }

                res.status(200).json({ message: 'Post and related data deleted successfully' });
              });
            });
          });
        });
      });
    });
  });
};

exports.getPostById = (req, res) => {
  const postId = req.params.post_id;
  const userId = req.query.user_id;

  const query = `
  SELECT 
      users.avatar_image,
      posts.*,
      users.name,
      GROUP_CONCAT(DISTINCT images.path ORDER BY images.image_id) AS imageUrls,
      COUNT(DISTINCT likes.like_id) AS likeCount,
      (SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END
      FROM likes 
      WHERE likes.post_id = posts.post_id AND likes.user_id = ?) AS isLiked,
      COUNT(DISTINCT comments.comment_id) AS commentCount
    FROM 
      posts 
    JOIN 
      users  ON posts.user_id = users.user_id
    LEFT JOIN 
      images ON posts.post_id = images.post_id
    LEFT JOIN 
      likes ON posts.post_id = likes.post_id
    LEFT JOIN 
      comments ON posts.post_id = comments.post_id
    WHERE 
      posts.post_id = ?
    GROUP BY 
      posts.post_id, users.avatar_image, users.name
    ORDER BY 
      posts.created_at DESC;
  `;

  connection.query(query, [userId, postId], (err, results) => {
    if (err) {
      console.error('Error retrieving post:', err.stack);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = results[0];
    const imageUrls = post.imageUrls ? post.imageUrls.split(',') : [];

    res.status(200).json({ 
      message: 'Post loaded successfully', 
      post: {
        post_title: post.title,
        post_content: post.content,
        post_group: post.category,
        isRecipe: post.is_recipe,
      }
    });
  });
};

exports.getAllPosts = (req, res) => {
  const userId = req.query.user_id;

  const query = `
  SELECT 
      users.avatar_image,
      posts.*,
      users.name,
      GROUP_CONCAT(DISTINCT images.path ORDER BY images.image_id) AS imageUrls,
      COUNT(DISTINCT likes.like_id) AS likeCount,
      (SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END
       FROM likes 
       WHERE likes.post_id = posts.post_id AND likes.user_id = ?) AS isLiked,
      COUNT(DISTINCT comments.comment_id) AS commentCount
    FROM 
      posts 
    JOIN 
      users  ON posts.user_id = users.user_id
    LEFT JOIN 
      images ON posts.post_id = images.post_id
    LEFT JOIN 
      likes ON posts.post_id = likes.post_id
    LEFT JOIN 
      comments ON posts.post_id = comments.post_id
    GROUP BY 
      posts.post_id, users.avatar_image, users.name
    ORDER BY 
      posts.created_at DESC;
  `;

  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error retrieving posts:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(200).json(results);
  });
};

exports.getPopularPosts = (req, res) => {
  const userId = req.query.user_id;
  let daysInterval = 30;

  const getPopularPosts = (days) => {
    const query = `
      SELECT 
        users.avatar_image,
        posts.*,
        users.name,
        GROUP_CONCAT(DISTINCT images.path ORDER BY images.image_id) AS imageUrls,
        COUNT(DISTINCT likes.like_id) AS likeCount,
        (SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END
         FROM likes 
         WHERE likes.post_id = posts.post_id AND likes.user_id = ?) AS isLiked,
        COUNT(DISTINCT comments.comment_id) AS commentCount
      FROM 
        posts 
      JOIN 
        users  ON posts.user_id = users.user_id
      LEFT JOIN 
        images ON posts.post_id = images.post_id
      LEFT JOIN 
        likes ON posts.post_id = likes.post_id
      LEFT JOIN 
        comments ON posts.post_id = comments.post_id
      WHERE 
        posts.created_at >= DATE_SUB(CURRENT_TIMESTAMP(), INTERVAL ? DAY)
      GROUP BY 
        posts.post_id
      ORDER BY 
        likeCount DESC
      LIMIT 5;
    `;

    connection.query(query, [userId, days], (err, results) => {
      if (err) {
        console.error('Error retrieving popular posts:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (results.length < 5 && days < 365) {
        getPopularPosts(days + 30);
      } else {
        res.status(200).json(results);
      }
    });
  };

  getPopularPosts(daysInterval);
};
