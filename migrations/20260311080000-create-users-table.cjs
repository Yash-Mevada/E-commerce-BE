'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Enable pgcrypto extension
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    // 2. Create users table if it does not exist
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        password TEXT NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        phone_number VARCHAR(15),
        role TEXT DEFAULT 'user',
        refresh_token TEXT,
        fcm_token TEXT,
        access_token TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Ensure refresh_token, fcm_token, and access_token exist if the table was already created
    await queryInterface.sequelize.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token TEXT;');
    await queryInterface.sequelize.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT;');
    await queryInterface.sequelize.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS access_token TEXT;');

    // 4. Ensure username column is dropped if present
    await queryInterface.sequelize.query('ALTER TABLE users DROP COLUMN IF EXISTS username;');

    // 5. Seed the default admin user with password '123'
    await queryInterface.sequelize.query(`
      INSERT INTO users (id, first_name, last_name, email, password, role, created_at, updated_at)
      VALUES (
        gen_random_uuid(), 
        'Admin', 
        'User', 
        'admin@ecommerce.com', 
        '$2b$10$7J4NZYpDhbXlyZLmIicC2O0RiAvfhqCeyg.ZPsTEZ/Uvxe1pvu/Hi', 
        'admin', 
        NOW(), 
        NOW()
      )
      ON CONFLICT (email) DO NOTHING;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};
