'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn("customers", "cognito_sub", {
        type: Sequelize.STRING,
        allowNull: true,
      });
      await queryInterface.addColumn("customers", "access_token", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
      await queryInterface.addColumn("customers", "refresh_token", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    } catch (error) {
      // Safely ignore error if columns already exist
      if (error instanceof Error && !error.message.includes("already exists")) {
        throw error;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn("customers", "cognito_sub");
      await queryInterface.removeColumn("customers", "access_token");
      await queryInterface.removeColumn("customers", "refresh_token");
    } catch (error) {
      // Safely ignore if columns do not exist
    }
  }
};
