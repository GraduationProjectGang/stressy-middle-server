const Sequelize = require('sequelize');

module.exports = class Device extends Sequelize.Model{
    static init(sequelize) {
        return super.init({
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            androidId:{
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            location:{
                type: Sequelize.STRING(100),
                allowNull: true,
            }
        }, {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'Device',
            tableName: 'devices',
            paranoid: false,
            charset: 'utf8',
            collate: 'utf8_general_ci',
        });
    };

    static associate(db) {
        db.Device.hasOne(db.Token);
        db.Device.belongsToMany(db.Party, {
            through: 'device_party',
        });
    }
};