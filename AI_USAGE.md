<<<<<<< HEAD
# AI_USAGE.md — AI Tool Usage Log

## Tool Used
**Claude (Anthropic)** — claude.ai

---

## How I Used Claude

Claude was used as a primary development collaborator throughout this project.
I acted as the engineer — making all product and architectural decisions.
Claude helped with code generation, debugging, and implementation details.

Key prompts used:
- "Design a PostgreSQL schema for a shared expenses app where group membership changes over time"
- "Write a CSV import route in Node.js that detects duplicate entries using a composite key"
- "How should I handle negative amounts in expense CSV — refund or error?"
- "Write balance calculation SQL that accounts for settlements separately"

---

## Three Cases Where Claude Was Wrong

### Case 1: Duplicate Detection

**What Claude produced:**
```javascript
const dupKey = `${row.description?.trim().toLowerCase()}`;
```
Description-only duplicate key.

**Problem I caught:**
Marina Bites had two entries — same description, same date, same amount. 
But if two different dinners had same name on different dates, 
description-only would incorrectly flag them as duplicates.

**What I changed:**
```javascript
const dupKey = `${row.date?.trim()}-${row.description?.trim().toLowerCase()}-${row.amount}`;
```
Added date + amount to make key more precise.

---

### Case 2: USD Conversion Applied Twice

**What Claude produced:**
Amount was converted to INR in import route, then frontend 
was also multiplying by 84 when displaying.

**Problem I caught:**
USD expenses were showing 84x the correct amount in balances.

**What I changed:**
Removed conversion from frontend — conversion only happens once 
in backend during import. `amount_inr` field is used directly for display.

---

### Case 3: Meera Exclusion Not Implemented

**What Claude produced:**
Import route was not checking group membership dates — 
Meera was being included in all April expenses despite moving out in March.

**Problem I caught:**
Sam's requirement — "I moved in mid-April, why would March electricity 
affect my balance?" — same issue applied to Meera in reverse.
April groceries CSV row still had Meera in split_with.

**What I changed:**
Added membership date check in import route — 
if user's left_at date is before expense_date, exclude from split.

---

## My Role vs Claude's Role

| Task | Who did it |
|------|-----------|
| Product decisions | Me |
| Database schema design | Me + Claude |
| Anomaly detection logic | Me |
| Route implementation | Claude (reviewed by me) |
| Bug fixing | Me |
| Deployment | Me |
| Documentation | Me |
| Understanding every line | Me |
=======

>>>>>>> 6f7eea6 (docs: add third AI error case - Meera exclusion bug)
