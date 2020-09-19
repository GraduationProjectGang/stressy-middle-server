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
            timestamps: false,
            underscored: false,
            modelName: 'Party',
            tableName: 'paties',
            paranoid: false,
            charset: 'utf8',
            collate: 'utf8_general_ci',
        });
    };

    static associate(db) {
        db.Party.belongsToMany(db.Device, {
            through: 'device_party',
        });
    }
};