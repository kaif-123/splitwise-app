# SCOPE.md — Anomaly Log & Database Schema

## Data Problems Found in expenses_export.csv

| # | Row | Problem | Action Taken |
|---|-----|---------|--------------|
| 1 | 5 | Duplicate entry — "dinner - marina bites" same as row 4 | Skipped duplicate |
| 2 | 13 | Settlement logged as expense — "Rohan paid Aisha back" | Moved to settlements table |
| 3 | 10 | Amount has comma — "1,200" | Stripped comma, parsed as 1200 |
| 4 | 28 | Pizza Friday percentage sums to 110% not 100% | Normalized to 100% |
| 5 | 22 | Missing paid_by — "House cleaning supplies" | Skipped — cannot determine payer |
| 6 | 9,19,20,21 | USD currency — Goa trip expenses | Converted at 1 USD = 84 INR |
| 7 | 25 | Negative amount — Parasailing refund -30 USD | Treated as refund, amount negated |
| 8 | Multiple | Inconsistent date formats — YYYY-MM-DD, DD/MM/YYYY, Mon DD | Normalized to YYYY-MM-DD |
| 9 | 27 | Missing currency — Groceries DMart March | Defaulted to INR |
| 10 | 28 | Amount has leading/trailing spaces — " 1450 " | Trimmed and parsed |
| 11 | 34 | Ambiguous date — "04/05/2026" could be Apr 5 or May 4 | Defaulted to Apr 5, flagged in report |
| 12 | 31 | Zero amount — Swiggy order | Skipped — placeholder entry |
| 13 | 35 | Meera in April split — she moved out end of March | Excluded from April expenses |
| 14 | 21 | Unknown person — "Dev's friend Kabir" | Excluded from split |

## Database Schema

### users
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | User ID |
| name | VARCHAR | Full name |
| email | VARCHAR UNIQUE | Email |
| password | VARCHAR | Bcrypt hashed |
| created_at | TIMESTAMP | Registration time |

### groups
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Group ID |
| name | VARCHAR | Group name |
| created_at | TIMESTAMP | Creation time |

### group_members
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Record ID |
| group_id | FK | References groups |
| user_id | FK | References users |
| joined_at | DATE | When member joined |
| left_at | DATE | When member left (null if active) |

### expenses
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Expense ID |
| group_id | FK | References groups |
| description | VARCHAR | Expense description |
| paid_by | FK | References users |
| amount | DECIMAL | Original amount |
| currency | VARCHAR | INR or USD |
| amount_inr | DECIMAL | Converted to INR |
| split_type | VARCHAR | equal/percentage/share |
| expense_date | DATE | Date of expense |
| is_settlement | BOOLEAN | True if settlement |

### expense_splits
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Split ID |
| expense_id | FK | References expenses |
| user_id | FK | References users |
| amount_owed | DECIMAL | Amount this user owes |

### settlements
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Settlement ID |
| group_id | FK | References groups |
| paid_by | FK | Who paid |
| paid_to | FK | Who received |
| amount | DECIMAL | Amount settled |
| settlement_date | DATE | Date of settlement |

### import_log
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Log ID |
| row_number | INTEGER | CSV row number |
| issue | VARCHAR | Problem detected |
| action_taken | VARCHAR | What app did |
| raw_data | TEXT | Original CSV row |
