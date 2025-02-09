const db = require('../models/db');
const bcrypt = require('bcrypt');

exports.getLoginPage = (req, res) => {
  if (req.session.userId) {
    return res.redirect('/items/dashboard');
  }
  res.render('login', { message: null });
};

exports.getRegisterPage = (req, res) => {
  if (req.session.userId) {
    return res.redirect('/items/dashboard');
  }
  res.render('register', { message: null });
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).render('login', { 
      message: 'Email and password required.' 
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).render('login', { 
      message: 'Invalid email format.' 
    });
  }

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error('[Database Error] Login:', err.message);
      return res.status(500).render('login', { 
        message: 'Internal Error.' 
      });
    }

    if (!results || results.length === 0) {
      return res.status(401).render('login', { 
        message: 'Invalid credentials.' 
      });
    }

    const user = results[0];

    bcrypt.compare(password, user.password, (err, passwordMatches) => {
      if (err || !passwordMatches) {
        return res.status(401).render('login', { 
          message: 'Invalid credentials.' 
        });
      }

      // add admin_id to user
      if (user.role === 'admin' && !user.admin_id) {
        const updateSql = 'UPDATE users SET admin_id = ? WHERE id = ?';
        db.query(updateSql, [user.id, user.id], (updateErr) => {
          if (updateErr) {
            console.error('Failed to assign admin_id:', updateErr);
          }
          setupSessionAndRedirect(req, res, {
            ...user,
            admin_id: user.id
          });
        });
      } else {
        setupSessionAndRedirect(req, res, user);
      }
    });
  });
};

function setupSessionAndRedirect(req, res, user) {
  // Session settings
  req.session.userId = user.id;
  req.session.email = user.email;
  req.session.role = user.role;
  req.session.name = user.name;
  req.session.picture = user.picture;
  req.session.admin_id = user.admin_id;

  // add adminInfo to session
  if (user.role === 'admin') {
    req.session.adminInfo = {
      id: user.id,
      role: 'admin',
      name: user.name,
      picture: user.picture,
      admin_id: user.admin_id
    };
  }

  req.session.save((err) => {
    if (err) {
      console.error('[Session Error]:', err);
      return res.status(500).render('login', { 
        message: 'Error creating session.' 
      });
    }
    res.redirect('/items/dashboard');
  });
}

exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error', err);
      return res.status(500).json({ message: 'Failed to logout. Please try again. Try again.' });
    }
    res.redirect('/auth/login');
  });
};

exports.register = (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).render('register', { 
      message: {
        type: 'error',
        text: 'All fields required.'
      }
    });
  }

  const sqlCheck = 'SELECT * FROM users WHERE email = ?';
  db.query(sqlCheck, [email], (err, results) => {
    if (err) {
      console.error('[Database Error] Register:', err.message);
      return res.status(500).render('register', { 
        message: {
          type: 'error',
          text: 'Internal Error '
        }
      });
    }

    if (results.length > 0) {
      return res.status(400).render('register', { 
        message: {
          type: 'error',
          text: 'Email already exists.'
        }
      });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error('[Bcrypt Error] Hash:', err.message);
        return res.status(500).render('register', { 
          message: {
            type: 'error',
            text: 'Internal Error'
          }
        });
      }

      const sql = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
      db.query(sql, [name, email, hashedPassword, 'user'], (err) => {
        if (err) {
          console.error('[Database Error] Invalid User:', err.message);
          return res.status(500).render('register', { 
            message: {
              type: 'error',
              text: 'Failed to create account.'
            }
          });
        }

        res.redirect('/auth/login');
      });
    });
  });
};