const db = require('../models/db');

/**
  this function is used to calculate the score of an item based on the filters
 */
function computeScore(item, filters) {
  let score = 0;

  // 1. General filters
  if (filters.state && item.u_state === filters.state) score += 1;
  if (filters.city && item.u_city === filters.city) score += 1;

  // 2. Value filters
  if (filters.valorMin !== undefined && filters.valorMax !== undefined) {
    const comparedValue =
      filters.tab === 'First' ? item.u_price_02 : item.u_price_03;

    if (
      comparedValue >= filters.valorMin &&
      comparedValue <= filters.valorMax
    ) {
      score += 1;
    }
  }

  // 3. Discount filter
  if (filters.discountMin !== undefined) {
    if (item.u_discount >= filters.discountMin) {
      score += 1;
    }
  }

  return score;
}

/**
 * GET /items/dashboard
 * Render dashboard page based on the tab selected.
 */

exports.getDashboard = (req, res) => {
  const tab = req.query.tab || 'first';
  const userId = req.session.userId;
  const scoreFilter = parseInt(req.query.score) || 0;
  
  // Filters query
  const filters = [];
  const values = [];

  // Base conditions
  const conditions = {
    first: '(i.u_date_01 > NOW() OR i.u_date_02 > NOW()) AND i.user_id IS NULL',
    last: 'i.u_date_03 > NOW() AND i.u_date_03 IS NOT NULL AND i.user_id IS NULL',
    archived: '(i.u_date_01 < NOW() OR i.u_date_02 < NOW() OR i.u_date_03 < NOW())'
  };

  // Add filters to query
  if (req.query.state) {
    filters.push('i.u_state = ?');
    values.push(req.query.state);
  }

  if (req.query.city) {
    filters.push('i.u_city = ?');
    values.push(req.query.city);
  }

  if (req.query.valorMin) {
    filters.push('i.u_price_01 >= ?');
    values.push(req.query.valorMin);
  }

  if (req.query.valorMax) {
    filters.push('i.u_price_01 <= ?');
    values.push(req.query.valorMax);
  }

  if (req.query.discountMin) {
    filters.push('i.u_discount >= ?');
    values.push(req.query.discountMin);
  }

  // Query to get items
  let sql = `
    SELECT i.*, 
           COALESCE(f.filters_json, '{}') as datefilter
    FROM items i
    LEFT JOIN filters f ON f.user_id = ?
    WHERE ${conditions[tab]}
  `;

  values.unshift(userId); // Add userId to values

  if (filters.length > 0) {
    sql += ` AND ${filters.join(' AND ')}`;
  }

  sql += ' ORDER BY i.id DESC';

  db.query(sql, values, (err, items) => {
    if (err) {
      console.error('Error: Items not found:', err);
      return res.status(500).render('500', {
        message: 'Failed to load items',
        user: req.session
      });
    }

    // Calculate score for each item
    items = items.map(item => {
      const score = computeScore(item, req.query);
      let scoreClass;
      
      if (score >= 4) {
          scoreClass = 'green-border';
      } else if (score === 3) {
          scoreClass = 'yellow-border';
      } else if (score === 2) {
          scoreClass = 'orange-border';
      } else {
          scoreClass = 'red-border';
      }
  
      return {
          ...item,
          score,
          scoreClass
      };
  }).filter(item => {
      const scoreFilter = parseInt(req.query.score) || 0;
      if (scoreFilter === 1) return item.score <= 1;
      if (scoreFilter === 2) return item.score === 2;
      if (scoreFilter === 3) return item.score === 3;
      if (scoreFilter === 4) return item.score >= 4;
      return true;
  });

    // Find unique params
    const states = [...new Set(items.map(i => i.u_state))].filter(Boolean);
    const cities = [...new Set(items.map(i => i.u_city))].filter(Boolean);

    res.render('dashboard', {
      items,
      tab,
      query: req.query,
      states,
      cities,
      user: req.session
    });
  });
};

/**
 * POST /items/reserve
 * Reserve an item.
 */

exports.reserveItem = (req, res) => {
  const userId = req.session.userId;
  const itemId = parseInt(req.body.itemId, 10);

  if (!itemId || isNaN(itemId)) {
    return res.status(400).json({ message: ' Invalid item ID.' });
  }

  db.getConnection((err, connection) => {
    if (err) {
      console.error('Error: Failed to connect to database:', err);
      return res.status(500).json({ message: 'Error reserving item.' });
    }

    connection.beginTransaction(err => {
      if (err) {
        connection.release();
        console.error('Reservation failed ', err);
        return res.status(500).json({ message: 'Error reserving item.' });
      }

      const sqlCheck = 'SELECT user_id FROM items WHERE id = ? FOR UPDATE';
      connection.query(sqlCheck, [itemId], (err, results) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            console.error('Error checking item availability', err);
            res.status(500).json({ message: 'Error reserving item.' });
          });
        }

        if (results.length === 0) {
          return connection.rollback(() => {
            connection.release();
            res.status(404).json({ message: 'item not found.' });
          });
        }

        if (results[0].user_id) {
          return connection.rollback(() => {
            connection.release();
            res.status(400).json({ message: 'Item is already reserved or does not exist.' });
          });
        }

        const sqlUpdate = 'UPDATE items SET user_id = ? WHERE id = ?';
        connection.query(sqlUpdate, [userId, itemId], (err, result) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error('Error to reserve item:', err);
              res.status(500).json({ message: 'Error reserving item.' });
            });
          }

          connection.commit(err => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                console.error('Feiled to commit transaction:', err);
                res.status(500).json({ message: 'Error reserving item.' });
              });
            }

            connection.release();
            res.status(200).json({ message: 'Successfully reserved.' });
          });
        });
      });
    });
  });
};

/**
 * POST /items/remove-reservation
 * Remove reservation.
 */
exports.removeReservation = (req, res) => {
  const userId = req.session.userId;
  const itemId = parseInt(req.body.itemId, 10);

  if (!itemId || isNaN(itemId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid item ID '
    });
  }

  const sql = 'UPDATE items SET user_id = NULL WHERE id = ? AND user_id = ?';
  
  db.query(sql, [itemId, userId], (err, result) => {
    if (err) {
      console.error('[Database Error] Failed to remove reservation:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Internal error while trying to remove reservation.'
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Reservation removed successfully reserved'
    });
  });
};

/**
 * GET /items/cards
 * List items.
 */
exports.getReservedItems = (req, res) => {
  const userId = req.session.userId;

  const sql = `
    SELECT * FROM items 
    WHERE user_id = ?
  `;
  
  db.query(sql, [userId], (err, reservation) => {
    if (err) {
      console.error('Reservation not found:', err);
      return res.render('500', {
        message: 'Failed to retrieve reservation',
        user: req.session
      });
    }

    res.render('cards', {
      reservation: reservation,
      user: req.session
    });
  });
};

exports.getItemDetails = (req, res) => {
  const itemId = parseInt(req.query.id, 10);

  if (!itemId || isNaN(itemId)) {
    return res.render('404', {
      message: 'Invalid item ID',
      user: req.session
    });
  }

  const sql = 'SELECT * FROM items WHERE id = ?';
  
  db.query(sql, [itemId], (err, results) => {
    if (err) {
      return res.render('500', {
        message: 'Failed to load item',
        user: req.session
      });
    }

    if (!results || results.length === 0) {
      return res.render('404', {
        message: 'Item not found',
        user: req.session
      });
    }

    res.render('item-details', {
      item: results[0],
      user: req.session
    });
  });
};