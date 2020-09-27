//moved to the socket.js.

// const bcrypt = require('bcrypt');
// const socket = require('socket.io');
// const dotenv = require('dotenv');
// const seed = require('seed-random');
// const jwt = require('jsonwebtoken');
// const crypto = require('crypto');


// dotenv.config();

// const crypto = require('crypto');

// const algorithm = 'aes-192-cbc';
// // Use the async `crypto.scrypt()` instead.
// const saltRounds = 10;
// const key = crypto.scryptSync(env.process.AUTH_SECRET, 'salt', saltRounds);
// // Use `crypto.randomBytes` to generate a random iv instead of the static iv
// // shown here.
// const iv = Buffer.alloc(16, 0); // Initialization vector.

// const cipher = crypto.createCipheriv(algorithm, key, iv);

// let encrypted = cipher.update('some clear text data', 'utf8', 'hex');
// encrypted += cipher.final('hex');
// console.log(encrypted);

// exports = (server) => {
//     const io = socket(server, { path : '/socket.io' });
    
//     io.on('connection', (socket) => {
//         const req = socket.request;
//         const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
//         socket.on('error', (error) => {
//             console.log(error);
//         });


//     });
// }   

// exports = (socket, next) =>{
//     socket.on('req-auth', (data) => {
//         const prime = 179424673;
//         socket.nonce = (seed() % prime);
//         socket.deviceId = data.deviceId;
//         io.emit("send-challenge", socket.nonce);
//     });

//     socket.on('calc-challenge', async (data) => {
//         const saltRounds = 10;
        
//         const key = await bcrypt.hashSync(socket.challenge 
//             + process.env.AUTH_SECRET 
//             + socket.deviceId, saltRounds);

//         if(hash == data.calc_challenge) {
            
//             const token = jwt.sign({
//                 deviceId: socket.deviceId,
//                 name: user.name,
//               }, process.env.JWT_SECRET, {
//                 expiresIn: '30m', // 30분
//                 issuer: 'stressy-middle',
//               });
//             io.emit('auth-success', token);
//         } else{
//             io.emit('auth-failed');
//         }
//     });
    
//     socket.on("disconnect", () => {
//         console.log("user-disconnected");
//         io.emit("user-disconnected");
//     });
// };