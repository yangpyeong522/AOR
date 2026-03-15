const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const yangpyeong_user = sequelize.define('yangpyeong_user', {
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    },
  }, {
    tableName: 'yangpyeong_user',
    timestamps: false,
});  

module.exports = yangpyeong_user;