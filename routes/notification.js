//module
const admin = require("firebase-admin");
const cron = require('node-cron');
//sequelize model
const { Device, Party, Token, User, sequelize } = require('../models');

//fcm init
var serviceAccount = require(".././serviceKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://datacollect-18877.firebaseio.com"
});

const scheduleEnqueuing = async () =>{
    const tokens = await Token.findAll();
    let registrationTokens = [];
    for (let i = 0; i < tokens.length; i++) {      
        console.log(tokens[i].token); 
        registrationTokens.push(tokens[i].token);
    }
    
    try {
        cron.schedule('*/3 * * * *', () => {
            console.log('매 15분 마다 실행');
            const message = {
                data: {title: '850', body: '2:45'},
                tokens: registrationTokens,
                priority:"10"
            };
            //send message
            admin.messaging().sendMulticast(message)
                .then((response) => {
                    // Response is a message ID string.
                    console.log('Successfully sent message:', response);
                })
                .catch((error) => {
                    console.log('Error sending message:', error);
                });
        });
    } catch (error) {
        console.error(error);
    }   
};

scheduleEnqueuing();