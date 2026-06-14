# SplitEasy — Shared Expenses App

A shared expense management application inspired by Splitwise. The application helps groups track expenses, manage balances, record settlements, and import historical expense data from CSV files.

## AI Tool Used

Claude (Anthropic) were used as development assistants. All generated code was reviewed, modified, and tested before use.

## Setup Instructions

### Prerequisites

* Node.js v18+
* PostgreSQL or Supabase PostgreSQL

### Installation

```bash
git clone https://github.com/kaif-123/splitwise-app.git
cd splitwise-app
npm install
```

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_secret_key
PORT=3000
```

### Database Setup

Create the required PostgreSQL tables using the schema provided in the project.

### Run Locally

```bash
node server.js
```

## Current Features

* User registration and login
* JWT authentication
* PostgreSQL integration
* Group management
* Expense management
* Settlement tracking
* CSV import module (in progress)

## Planned Features

* Advanced anomaly detection
* Detailed import reports
* Balance simplification
* Member join/leave aware calculations

## Tech Stack

* Node.js
* Express.js
* PostgreSQL (Supabase)
* HTML/CSS/JavaScript

## Project Structure

```text
db/
middleware/
routes/
server.js
README.md
SCOPE.md
DECISIONS.md
AI_USAGE.md
```
