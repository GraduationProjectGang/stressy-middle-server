//module
const admin = require("firebase-admin");
const { size } = require("mathjs");
const cron = require('node-cron');
//sequelize model
const { Device, Party, Token, User, sequelize } = require('../models');
//fcm init
// var serviceAccount = require(".././serviceKey.json");
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://datacollect-18877.firebaseio.com"
// });

// exports.scheduleEnqueuing = async () =>{


exports.scheduleEnqueuing = async () =>{
    const tokens = await Token.findAll();
    console.log(tokens);
    let registrationTokens = [];
    for (let i = 0; i < tokens.length; i++) {      
        console.log(tokens[i].tokenId); 
        registrationTokens.push(tokens[i].tokenId);
    }
    
    try {
        //if token array is empty, return
        if(tokens.length == 0) return;
        cron.schedule('*/15 * * * *', () => {
            require('log-timestamp');
            console.log('매 15분 마다 실행');
            const message = {
                data: {title: 'dataCollect', body: 'dataCollect'},
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
