<<<<<<< HEAD
# DECISIONS.md — Decision Log

## 1. Tech Stack Choice

**Decision:** Node.js + Express + PostgreSQL + Vanilla JS

**Options considered:**
- Django + React (as per JD)
- Node.js + Express + PostgreSQL + Vanilla JS

**Why chosen:**
Node.js is my primary backend stack with production experience (LocalFix project). 
Choosing an unfamiliar stack (Django) under a 2-day deadline would risk a broken 
submission. A working app I understand completely scores higher than a polished app 
I cannot explain — as stated in the assignment brief.

---

## 2. Relational Database — PostgreSQL via Supabase

**Decision:** PostgreSQL hosted on Supabase

**Options considered:**
- MongoDB (familiar)
- PostgreSQL on Railway
- PostgreSQL on Supabase

**Why chosen:**
Assignment explicitly required relational DB only. Supabase provides free PostgreSQL 
with instant setup. Railway free tier was exhausted.

---

## 3. USD Conversion Rate

**Decision:** Fixed rate 1 USD = 84 INR

**Options considered:**
- Live exchange rate via API
- Fixed rate at time of import

**Why chosen:**
Expenses are historical — using live rate would change balances every day. 
Fixed rate at import time ensures consistent, reproducible calculations. 
Rate is documented and visible in code.

---

## 4. Duplicate Detection Strategy

**Decision:** Key = date + description (lowercase) + amount

**Options considered:**
- Exact string match on description only
- date + description + amount composite key

**Why chosen:**
Description-only match would miss same-day different-amount entries. 
Composite key catches the Marina Bites duplicate (same date, same description, 
same amount) while allowing legitimate same-day different expenses.

---

## 5. Negative Amount — Refund vs Error

**Decision:** Treat as refund, negate the amount

**Options considered:**
- Skip as error
- Treat as refund (negative expense)
- Flag for manual review

**Why chosen:**
CSV note says "one slot got cancelled" — clear refund intent. 
Skipping would lose financial data. Negating amount correctly reduces 
the group's total expenditure for that item.

---

## 6. Missing paid_by

**Decision:** Skip the row entirely

**Options considered:**
- Default to group admin
- Skip row
- Flag for manual entry

**Why chosen:**
Cannot assume who paid — wrong assumption would corrupt all balances. 
Skipping is the only safe choice. Row is logged in import report for manual 
follow-up.

---

## 7. Meera after March

**Decision:** Exclude Meera from April+ expenses in splits

**Options considered:**
- Include Meera in all expenses as-is
- Filter by group membership dates

**Why chosen:**
Sam's requirement — "I moved in mid-April, why would March electricity affect 
my balance?" — same logic applies to Meera. group_members table has left_at 
column to handle this correctly.

---

## 8. Settlement Detection

**Decision:** Detect by empty split_type + settlement keyword in notes

**Options considered:**
- Manual flagging
- Keyword detection in notes/description

**Why chosen:**
CSV row 13 has empty split_type and note says "this is a settlement not an expense". 
Keyword detection handles this case. Settlements are stored separately in 
settlements table, not expenses table.

---

## 9. Ambiguous Date 04/05/2026

**Decision:** Default to April 5, 2026 — flag in import report

**Options considered:**
- Reject row
- Default to April 5
- Default to May 4

**Why chosen:**
Context clue — surrounding entries are April dated. April 5 is more likely. 
Flagged clearly in import report so user can verify and correct manually.

---

## 10. Percentage Sum != 100%

**Decision:** Normalize percentages to sum to 100%

**Options considered:**
- Skip row
- Use as-is (wrong splits)
- Normalize proportionally

**Why chosen:**
Skipping loses valid expense data. Using as-is gives wrong balances. 
Normalization preserves intent while ensuring correct math. 
Flagged in import report.
=======

>>>>>>> a767ba7 (docs: add deployment decision - Render vs Railway)
