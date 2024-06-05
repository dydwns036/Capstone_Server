const connection = require('../config/db');

exports.login = (req, res) => {
  const { account, password } = req.body;
  if (!account || !password) {
    return res.status(400).json({ error: 'account and password are required' });
  }

  const query = 'SELECT * FROM users WHERE account =? AND password =?';
  connection.query(query, [account, password], (err, results) => {
    if (err) {
      console.error('Error executing query:', err.sqlMessage);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid name or password' });
    }

    const user = results[0];
    res.status(200).json({ message: 'Login successful', user: {
      user_id: user.user_id,
      name: user.name,
      account: user.account,
      email: user.email,
      avatar_image: user.avatar_image,
      is_admin: user.is_admin
    } });
  });
};

exports.getUserByname = (req, res) => {
  const account = req.params.account;
  const query = 'SELECT user_id, name, account, email, avatar_image, is_admin FROM users WHERE account = ?';
  
  connection.query(query, [account], (err, results) => {
    if (err) {
      console.error('Error executing query:', err.sqlMessage);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = results[0];
    res.status(200).json({ message: 'User found', user });
  });
};

exports.signup = (req, res) => {
  const { name, account, email, password } = req.body;
  if (!name || !account || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  connection.query('SELECT * FROM users WHERE account = ?', [account], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (results.length > 0) {
      return res.status(400).json({ error: 'Account ID already exists' });
    }

    connection.query('INSERT INTO users (name, account, email, password, avatar_image) VALUES (?, ?, ?, ?, "")', [name, account, email, password], (err) => {
      if (err) {
        console.error('Error inserting new user:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.status(201).json({ message: 'User registration successful' });
    });
  });
};

exports.getAllUsers = (req, res) => {
  const query = 'SELECT * FROM users';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(200).json({ users: results });
  });
};

//exports.updateUser = (req, res) => {}
