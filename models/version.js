const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const version = sequelize.define('version', {
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  problem_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  ip: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  user: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  doc: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  when: {
    type: DataTypes.DATE,
    allowNull: true,
    // MySQL 8 이상에서는 (CURRENT_TIMESTAMP)도 동작할 수 있으나, 보통 아래처럼 사용:
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
  },
}, {
  tableName: 'version',
  timestamps: false,
});

module.exports = version;