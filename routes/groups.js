const express = require('express');
const router = express.Router();
const pool = require('../db/index');
const auth = require('../middleware/auth');

// Create group
router.post('/', auth, async (req, res) => {
  try {
    const { name, member_ids, joined_at } = req.body;
    
    const group = await pool.query(
      'INSERT INTO groups (name) VALUES ($1) RETURNING *',
      [name]
    );
    
    const groupId = group.rows[0].id;
    
    // Add members
    for (const userId of member_ids) {
      await pool.query(
        'INSERT INTO group_members (group_id, user_id, joined_at) VALUES ($1, $2, $3)',
        [groupId, userId, joined_at || new Date()]
      );
    }
    
    res.json(group.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all groups
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.*, 
        json_agg(json_build_object('id', u.id, 'name', u.name)) as members
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      JOIN users u ON gm.user_id = u.id
      WHERE gm.left_at IS NULL
      GROUP BY g.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add member to group
router.post('/:id/members', auth, async (req, res) => {
  try {
    const { user_id, joined_at } = req.body;
    await pool.query(
      'INSERT INTO group_members (group_id, user_id, joined_at) VALUES ($1, $2, $3)',
      [req.params.id, user_id, joined_at || new Date()]
    );
    res.json({ message: 'Member added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove member from group
router.patch('/:id/members/:userId/leave', auth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE group_members SET left_at = $1 WHERE group_id = $2 AND user_id = $3',
      [req.body.left_at || new Date(), req.params.id, req.params.userId]
    );
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;