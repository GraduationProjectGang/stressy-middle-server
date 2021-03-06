const Sequelize = require('sequelize');

module.exports = class Token extends Sequelize.Model{
    static init(sequelize) {
        return super.init({
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            tokenId: {
                type: Sequelize.STRING(200),
                allowNull: false,
            },
        }, {
            sequelize,
            timestamps: true,
            underscored: false,
            modelName: 'Token',
            tableName: 'token',
            paranoid: true,
            charset: 'utf8',
            collate: 'utf8_general_ci',
        });
    };

    static associate(db) {
      
    }
};