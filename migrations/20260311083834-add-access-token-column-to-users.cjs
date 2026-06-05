'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn("users", "access_token", {
        type: Sequelize.TEXT,
        allowNull: true,
      })
    } catch (error) {
      // Safely ignore error if column already exists
      if (error instanceof Error && !error.message.includes("already exists")) {
        throw error;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn("users", "access_token")
    } catch (error) {
      // Safely ignore if column does not exist
    }
  }
};
