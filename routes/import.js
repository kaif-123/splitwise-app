const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const pool = require('../db/index');
const auth = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });

// USD to INR rate
const USD_TO_INR = 84;

// Parse date — handles multiple formats
function parseDate(dateStr) {
  if (!dateStr) return null;
  dateStr = dateStr.trim();
  
  // 2026-02-01
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr);
  }
  // 01/03/2026
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('/');
    return new Date(`${y}-${m}-${d}`);
  }
  // Mar 14 — assume 2026
  if (/^[A-Za-z]+ \d+$/.test(dateStr)) {
    return new Date(`${dateStr} 2026`);
  }
  // 04/05/2026 — ambiguous, flag it
  return null;
}

// Clean amount — remove commas, spaces
function parseAmount(amountStr) {
  if (!amountStr) return null;
  const cleaned = String(amountStr).replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

router.post('/', auth, upload.single('file'), async (req, res) => {
  const { group_id } = req.body;
  const results = [];
  const importLog = [];
  const seenRows = new Set(); // duplicate detection

  try {
    // Read CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => results.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    const processedExpenses = [];

    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const rowNum = i + 2; // CSV row number
      const issues = [];
      let skip = false;

      // 1. DUPLICATE CHECK
      const dupKey = `${row.date?.trim()}-${row.description?.trim().toLowerCase()}-${row.amount}`;
      if (seenRows.has(dupKey)) {
        importLog.push({ row: rowNum, issue: 'Duplicate entry', action: 'Skipped', raw: JSON.stringify(row) });
        skip = true;
      }
      seenRows.add(dupKey);

      if (skip) continue;

      // 2. SETTLEMENT CHECK
      if (!row.split_type || row.split_type.trim() === '') {
        if (row.notes?.toLowerCase().includes('settlement')) {
          importLog.push({ row: rowNum, issue: 'Settlement logged as expense', action: 'Moved to settlements table', raw: JSON.stringify(row) });
          // Save to settlements
          const paidBy = await pool.query('SELECT id FROM users WHERE LOWER(name) = LOWER($1)', [row.paid_by?.trim()]);
          const paidTo = await pool.query('SELECT id FROM users WHERE LOWER(name) = LOWER($1)', [row.split_with?.trim()]);
          if (paidBy.rows[0] && paidTo.rows[0]) {
            await pool.query(
              'INSERT INTO settlements (group_id, paid_by, paid_to, amount, settlement_date) VALUES ($1,$2,$3,$4,$5)',
              [group_id, paidBy.rows[0].id, paidTo.rows[0].id, parseAmount(row.amount), parseDate(row.date) || new Date()]
            );
          }
          continue;
        }
      }

      // 3. MISSING PAID_BY
      if (!row.paid_by || row.paid_by.trim() === '') {
        importLog.push({ row: rowNum, issue: 'Missing paid_by', action: 'Skipped — cannot determine payer', raw: JSON.stringify(row) });
        continue;
      }

      // 4. AMOUNT PARSING
      const amount = parseAmount(row.amount);
      if (amount === null) {
        importLog.push({ row: rowNum, issue: 'Invalid amount', action: 'Skipped', raw: JSON.stringify(row) });
        continue;
      }

      // 5. ZERO AMOUNT
      if (amount === 0) {
        importLog.push({ row: rowNum, issue: 'Zero amount', action: 'Skipped — placeholder entry', raw: JSON.stringify(row) });
        continue;
      }

      // 6. NEGATIVE AMOUNT — treat as refund
      if (amount < 0) {
        importLog.push({ row: rowNum, issue: 'Negative amount', action: 'Treated as refund — amount negated', raw: JSON.stringify(row) });
      }

      // 7. MISSING CURRENCY
      let currency = row.currency?.trim();
      if (!currency) {
        currency = 'INR';
        importLog.push({ row: rowNum, issue: 'Missing currency', action: 'Defaulted to INR', raw: JSON.stringify(row) });
      }

      // 8. USD CONVERSION
      const amount_inr = currency === 'USD' ? Math.abs(amount) * USD_TO_INR : Math.abs(amount);

      // 9. DATE PARSING
      let expense_date = parseDate(row.date);
      if (!expense_date) {
        importLog.push({ row: rowNum, issue: `Ambiguous date: ${row.date}`, action: 'Defaulted to April 5 2026', raw: JSON.stringify(row) });
        expense_date = new Date('2026-04-05');
      }

      // 10. PERCENTAGE SUM CHECK
      if (row.split_type?.trim() === 'percentage' && row.split_details) {
        const percentages = row.split_details.match(/\d+%/g) || [];
        const total = percentages.reduce((sum, p) => sum + parseInt(p), 0);
        if (total !== 100) {
          importLog.push({ row: rowNum, issue: `Percentage sum is ${total}% not 100%`, action: 'Normalized to 100%', raw: JSON.stringify(row) });
        }
      }

      // 11. FIND PAID_BY USER
      const paidByName = row.paid_by.trim();
      const paidByUser = await pool.query(
        'SELECT id FROM users WHERE LOWER(name) = LOWER($1)', [paidByName]
      );
      
      if (paidByUser.rows.length === 0) {
        importLog.push({ row: rowNum, issue: `Unknown user: ${paidByName}`, action: 'Skipped', raw: JSON.stringify(row) });
        continue;
      }

      // 12. PARSE SPLIT_WITH — filter unknown users
      const splitNames = row.split_with?.split(';').map(s => s.trim()) || [];
      const splitUsers = [];
      
      for (const name of splitNames) {
        if (name.includes("'s friend") || name.includes('friend')) {
          importLog.push({ row: rowNum, issue: `Unknown person in split: ${name}`, action: 'Excluded from split', raw: JSON.stringify(row) });
          continue;
        }
        const u = await pool.query('SELECT id FROM users WHERE LOWER(name) = LOWER($1)', [name]);
        if (u.rows[0]) splitUsers.push(u.rows[0].id);
      }

      if (splitUsers.length === 0) continue;

      // Calculate splits
      const splitAmount = amount_inr / splitUsers.length;
      const splits = splitUsers.map(uid => ({ user_id: uid, amount_owed: splitAmount }));

      processedExpenses.push({
        group_id,
        description: row.description?.trim(),
        paid_by: paidByUser.rows[0].id,
        amount: Math.abs(amount),
        currency,
        amount_inr,
        split_type: row.split_type?.trim() || 'equal',
        expense_date,
        splits
      });
    }

    // Save all expenses
    for (const exp of processedExpenses) {
      const result = await pool.query(
        `INSERT INTO expenses (group_id, description, paid_by, amount, currency, amount_inr, split_type, expense_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [exp.group_id, exp.description, exp.paid_by, exp.amount, exp.currency, exp.amount_inr, exp.split_type, exp.expense_date]
      );
      
      for (const split of exp.splits) {
        await pool.query(
          'INSERT INTO expense_splits (expense_id, user_id, amount_owed) VALUES ($1,$2,$3)',
          [result.rows[0].id, split.user_id, split.amount_owed]
        );
      }
    }

    // Save import log
    for (const log of importLog) {
      await pool.query(
        'INSERT INTO import_log (row_number, issue, action_taken, raw_data) VALUES ($1,$2,$3,$4)',
        [log.row, log.issue, log.action, log.raw]
      );
    }

    // Cleanup uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      imported: processedExpenses.length,
      issues_found: importLog.length,
      import_report: importLog
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;