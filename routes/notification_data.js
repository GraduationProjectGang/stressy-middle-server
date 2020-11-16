//module
const admin = require("firebase-admin");
const { size, to } = require("mathjs");
const cron = require('node-cron');
//sequelize model
const { Device, Party, Token, User, sequelize } = require('../models');
//fcm init
// var serviceAccount = require(".././serviceKey.json");
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://datacollect-18877.firebaseio.com"
// });
require('log-timestamp');

const LogStr = "세지원 :";

// exports.scheduleEnqueuing = async () =>{

exports.scheduleEnqueuing = async () => {
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
            console.log(LogStr, '매 15분 마다 FCM을 통하여 클라이언트 앱의 DataCollectWorker 호출');
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
    
    try {
        //if token array is empty, return
        if(tokens.length == 0) return;
        cron.schedule('0 3 * * *', () => {
            require('log-timestamp');
            console.log(logStr, '매일 오전 3시마다 FCM을 통하여 클라이언트 앱의 TrainingWorker 호출');
            const message = {
                data: {title: 'startTraining', body: 'startTraining'},
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
