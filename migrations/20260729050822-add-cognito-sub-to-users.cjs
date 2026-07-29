'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // 1. Add column as nullable first to avoid errors with existing records
      await queryInterface.addColumn("users", "cognito_sub", {
        type: Sequelize.STRING,
        allowNull: true,
      });

      // 2. Update existing users with a dummy cognito_sub value
      await queryInterface.sequelize.query(
        "UPDATE users SET cognito_sub = 'temp-cognito-sub' WHERE cognito_sub IS NULL;"
      );

      // 3. Alter the column to be NOT NULL
      await queryInterface.changeColumn("users", "cognito_sub", {
        type: Sequelize.STRING,
        allowNull: false,
      });
    } catch (error) {
      // Safely ignore error if column already exists
      if (error instanceof Error && !error.message.includes("already exists")) {
        throw error;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn("users", "cognito_sub");
    } catch (error) {
      // Safely ignore if column does not exist
    }
  }
};
