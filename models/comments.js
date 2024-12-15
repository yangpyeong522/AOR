const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const comments = sequelize.define('comments', {
    _id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    tearbig: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    tearsmall: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    answer: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    testcase: {
        type: DataTypes.TEXT,
    },
    tags: {
        type: DataTypes.JSON,
    },
}, {
    tableName: 'comments',
    timestamps: false,
});

module.exports = comments;