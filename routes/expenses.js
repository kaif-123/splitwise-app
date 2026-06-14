const express = require('express');
const router = express.Router();
const pool = require('../db/index');
const auth = require('../middleware/auth');

// Add expense
router.post('/', auth, async (req, res) => {
  try {
    const { group_id, description, paid_by, amount, currency, split_type, expense_date, splits } = req.body;
    
    // USD to INR conversion
    const amount_inr = currency === 'USD' ? amount * 84 : amount;
    
    const expense = await pool.query(
      `INSERT INTO expenses (group_id, description, paid_by, amount, currency, amount_inr, split_type, expense_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [group_id, description, paid_by, amount, currency || 'INR', amount_inr, split_type, expense_date]
    );
    
    const expenseId = expense.rows[0].id;
    
    // Save splits
    for (const split of splits) {
      await pool.query(
        'INSERT INTO expense_splits (expense_id, user_id, amount_owed) VALUES ($1, $2, $3)',
        [expenseId, split.user_id, split.amount_owed]
      );
    }
    
    res.json(expense.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get expenses by group
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, u.name as paid_by_name,
        json_agg(json_build_object('user_id', es.user_id, 'amount_owed', es.amount_owed, 'name', u2.name)) as splits
      FROM expenses e
      JOIN users u ON e.paid_by = u.id
      JOIN expense_splits es ON e.id = es.expense_id
      JOIN users u2 ON es.user_id = u2.id
      WHERE e.group_id = $1 AND e.is_settlement = FALSE
      GROUP BY e.id, u.name
      ORDER BY e.expense_date DESC
    `, [req.params.groupId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get balances for group
router.get('/balances/:groupId', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.name,
        COALESCE(SUM(CASE WHEN e.paid_by = u.id THEN e.amount_inr ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(es.amount_owed), 0) as total_owed,
        COALESCE(SUM(CASE WHEN e.paid_by = u.id THEN e.amount_inr ELSE 0 END), 0) - 
        COALESCE(SUM(es.amount_owed), 0) as balance
      FROM users u
      JOIN group_members gm ON u.id = gm.user_id
      LEFT JOIN expense_splits es ON es.user_id = u.id
      LEFT JOIN expenses e ON es.expense_id = e.id AND e.group_id = $1 AND e.is_settlement = FALSE
      WHERE gm.group_id = $1
      GROUP BY u.id, u.name
      ORDER BY balance DESC
    `, [req.params.groupId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Settle debt
router.post('/settle', auth, async (req, res) => {
  try {
    const { group_id, paid_by, paid_to, amount, settlement_date } = req.body;
    
    const result = await pool.query(
      'INSERT INTO settlements (group_id, paid_by, paid_to, amount, settlement_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [group_id, paid_by, paid_to, amount, settlement_date || new Date()]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;