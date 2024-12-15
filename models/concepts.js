const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const concepts = sequelize.define('concepts', {
    _id: {
        type: DataTypes.STRING(255), // 문자열 타입
        allowNull: false,
        primaryKey: true, // 기본 키로 설정
    },
    koid: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    conception: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    code: {
        type: DataTypes.TEXT,
    },
}, {
    tableName: 'concepts',
    timestamps: false,
});

module.exports = concepts;