const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const comments = sequelize.define('comments', {
    problem_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    tearsmall: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    tearbig: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    tags: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    views: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    tableName: 'comments',
    timestamps: false,
});

module.exports = comments;