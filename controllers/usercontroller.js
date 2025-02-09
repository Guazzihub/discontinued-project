const db = require('../models/db');
const multer = require('multer');
const path = require('path');

/**
 * multer Setting (profile picture)
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `${req.session.userId}_${Date.now()}${ext}`;
    cb(null, filename);
  }
});
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('File type not allowed'), false);
      return;
    }
    cb(null, true);
  },
  limits: { 
    fileSize: 5 * 1024 * 1024,
    files: 1
  }
});

/**
 * GET /users/settings
 * Render settings page
 */
exports.getSettings = (req, res) => {
  const userId = req.session.userId;
  
  const sql = 'SELECT id, name, email, role, picture FROM users WHERE id = ?';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('User not found:', err);
      return res.status(500).render('500', {
        message: 'Settings not found',
        user: req.session
      });
    }

    if (!results || results.length === 0) {
      return res.status(404).render('404', {
        message: 'Failed to load.',
        user: req.session
      });
    }

    const user = results[0];
    res.render('settings', {
      user: req.session,
      userData: user,
      showAssignAdmin: user.role === 'user' && !user.admin_id,
      message: null
    });
  });
};

exports.updateSettings = (req, res) => {
  upload.single('picture')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ 
        success: false, 
        message: err.message 
      });
    }
    
    const userId = req.session.userId;
    const updateData = {};

    if (req.file) {
      updateData.picture = req.file.filename;
      req.session.picture = req.file.filename;
    }

    const sql = 'UPDATE users SET ? WHERE id = ?';
    db.query(sql, [updateData, userId], (err) => {
      if (err) {
        console.error('Settings not found:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to load.'
        });
      }

      res.status(200).json({ 
        success: true, 
        message: 'Settings updated.'
      });
    });
  });
};

/**
 * POST /users/assign-admin
 * let user assign admin.
 */
exports.assignAdminToUser = (req, res) => {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required'
    });
  }

  // Check if the user exists and is not already associated with an administrator
  const sqlCheckUser = 'SELECT role, admin_id FROM users WHERE id = ?';
  db.query(sqlCheckUser, [userId], (checkErr, userResults) => {
    if (checkErr) {
      console.error('[Database Error] Verify user:', checkErr.message);
      return res.status(500).json({
        success: false,
        message: 'Internal Error while trying to verify user'
      });
    }

    if (!userResults || userResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (userResults[0].role !== 'user') {
      return res.status(400).json({
        success: false,
        message: 'Only users can be assign to administrator'
      });
    }

    if (userResults[0].admin_id) {
      return res.status(400).json({
        success: false,
        message: 'User is already assigned to an administrator'
      });
    }

    const sqlFindAdmin = 'SELECT id FROM users WHERE role = "admin" LIMIT 1';
    db.query(sqlFindAdmin, (err, results) => {
      if (err) {
        console.error('[Database Error]:', err.message);
        return res.status(500).json({
          success: false,
          message: 'Internal Error could not find administrator'
        });
      }

      if (!results || results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Administrator not found'
        });
      }

      const adminId = results[0].id;
      const sqlUpdateUser = 'UPDATE users SET admin_id = ? WHERE id = ?';

      db.query(sqlUpdateUser, [adminId, userId], (updateErr) => {
        if (updateErr) {
          console.error('[Database Error] Assign admin:', updateErr.message);
          return res.status(500).json({
            success: false,
            message: 'Internal Error to assign administrator'
          });
        }

        return res.status(200).json({
          success: true,
          message: 'User was successfully assigned to the administrator'
        });
      });
    });
  });
};
