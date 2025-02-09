const db = require('../models/db');

exports.saveFilter = (req, res) => {
  const userId = req.session.userId;
  const { filterName, filters } = req.body;

  if (!filterName) {
    return res.status(400).json({
      success: false,
      message: 'Filter name is required.'
    });
  }

  const sqlInsert = 'INSERT INTO filters (user_id, name, filters_json) VALUES (?, ?, ?)';
  db.query(sqlInsert, [userId, filterName, JSON.stringify(filters)], (err, result) => {
    if (err) {
      console.error('[Database Error] Save filter:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Internal error: Failed to save filter.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Filter saved',
      filterId: result.insertId
    });
  });
};

exports.editFilter = (req, res) => {
  const userId = req.session.userId;
  const { filterId, newFilterName, action } = req.body;

  if (!filterId || !action) {
    return res.status(400).json({
      success: false,
      message: 'Filter ID required'
    });
  }

  if (action === 'rename' && !newFilterName) {
    return res.status(400).json({
      success: false,
      message: 'Filter name is required'
    });
  }

  if (action === 'rename') {
    const sqlUpdate = 'UPDATE filters SET name = ? WHERE id = ? AND user_id = ?';
    db.query(sqlUpdate, [newFilterName, filterId, userId], (err) => {
      if (err) {
        console.error('[Database Error] Rename filter:', err.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to rename filter.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Filter renamed'
      });
    });
  } else if (action === 'delete') {
    const sqlDelete = 'DELETE FROM filters WHERE id = ? AND user_id = ?';
    db.query(sqlDelete, [filterId, userId], (err) => {
      if (err) {
        console.error('[Database Error] Delete filter:', err.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to delete filter.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Filter deleted'
      });
    });
  }
};

exports.applyFilter = (req, res) => {
  const userId = req.session.userId;
  const { filterId } = req.body;

  if (!filterId) {
    return res.status(400).json({
      success: false,
      message: 'Filter ID required'
    });
  }

  const sql = 'SELECT filters_json FROM filters WHERE id = ? AND user_id = ?';
  db.query(sql, [filterId, userId], (err, results) => {
    if (err) {
      console.error('[Database Error] Apply filter:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to apply filter.'
      });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Filter not found'
      });
    }

    const params = new URLSearchParams(JSON.parse(results[0].filters_json)).toString();
    return res.status(200).json({
      success: true,
      redirectUrl: `/items/dashboard?${params}`
    });
  });
};