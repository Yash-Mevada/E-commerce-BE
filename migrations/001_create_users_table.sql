CREATE EXTENSION IF NOT EXISTS "pgcrypto";



-- create tabel

CREATE TABLE IF NOT EXISTS users(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  password TEXT NOT NUll,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone_number VARCHAR(15),
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users DROP COLUMN IF EXISTS username;