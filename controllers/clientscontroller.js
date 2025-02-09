const db = require('../models/db');

exports.listClients = (req, res) => {
  const adminId = req.session.userId;

  const query = 'SELECT * FROM users WHERE role = ? AND admin_id = ?';
  db.query(query, ['user', adminId], (err, clients) => {
    if (err) {
      return res.render('500', {
        message: 'Error loading clients.',
        user: req.session
      });
    }
    
    res.render('clients', {
      clients: clients,
      user: req.session
    });
  });
};

exports.clientDetails = (req, res) => {
  const clientId = parseInt(req.params.id, 10);
  const adminId = req.session.userId;

  const query = `SELECT * FROM users WHERE id = ? AND role = ? AND admin_id = ?`;
  
  db.query(query, [clientId, 'user', adminId], (err, results) => {
    if (err) {
      return res.render('500', {
        message: 'Client not found',
        user: req.session
      });
    }

    res.render('client-details', {
      client: results[0],
      user: req.session
    });
  });
};

exports.accessClientAccount = (req, res) => {
  const clientId = parseInt(req.params.id, 10);
  const adminId = req.session.userId;
  
  if (isNaN(clientId)) {
    return res.status(400).json({ message: 'Invalid client ID.' });
  }

  const query = 'SELECT * FROM users WHERE id = ? AND admin_id = ? AND role = ?';
  db.query(query, [clientId, adminId, 'user'], (err, results) => {
    if (err) {
      console.error('Error verifying permissions:', err);
      return res.status(500).json({ message: 'Internal Error.' });
    }

    if (results.length === 0) {
      return res.status(403).json({ message: 'Account does not have sufficient permissions.' });
    }

    // Update admin session
    req.session.adminInfo = {
      id: req.session.userId,
      role: 'admin',
      name: req.session.name,
      picture: req.session.picture
    };

    // Update client session
    req.session.clientView = results[0];
    
    res.redirect('/items/dashboard');
  });
};