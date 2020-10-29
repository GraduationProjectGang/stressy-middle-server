const Sequelize = require('sequelize');

module.exports = class Party extends Sequelize.Model{
    static init(sequelize) {
        return super.init({
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            size: {
                type: Sequelize.INTEGER,
            },
            
        }, {
            sequelize,
            timestamps: true,
            underscored: false,
            modelName: 'Party',
            tableName: 'paties',
            paranoid: true,
            charset: 'utf8',
            collate: 'utf8_general_ci',
        });
    };

    static associate(db) {
        db.Party.belongsToMany(db.User, {
            through: 'user_party',
        });
    }
};