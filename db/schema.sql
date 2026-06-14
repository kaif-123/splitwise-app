CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id),
  user_id INTEGER REFERENCES users(id),
  joined_at DATE NOT NULL,
  left_at DATE
);

CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id),
  description VARCHAR(255) NOT NULL,
  paid_by INTEGER REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  amount_inr DECIMAL(10,2) NOT NULL,
  split_type VARCHAR(20) NOT NULL,
  expense_date DATE NOT NULL,
  is_settlement BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE expense_splits (
  id SERIAL PRIMARY KEY,
  expense_id INTEGER REFERENCES expenses(id),
  user_id INTEGER REFERENCES users(id),
  amount_owed DECIMAL(10,2) NOT NULL
);

CREATE TABLE settlements (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id),
  paid_by INTEGER REFERENCES users(id),
  paid_to INTEGER REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  settlement_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE import_log (
  id SERIAL PRIMARY KEY,
  row_number INTEGER,
  issue VARCHAR(255),
  action_taken VARCHAR(255),
  raw_data TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);