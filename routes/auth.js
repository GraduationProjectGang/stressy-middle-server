const bcrypt = require('bcrypt');
const socket = require('socket.io');
const dotenv = require('dotenv');
const seed = require('seed-random');
const jwt = require('jsonwebtoken');
const NodeRSA = require('node-rsa');

dotenv.config();

const key = new rsa( {b: 2048});




exports = (socket, next) =>{
    
    socket.on('req-auth', (data) => {
        const prime = 179424673;
        socket.nonce = (seed() % prime);
        socket.deviceId = data.deviceId;
        io.emit("send-challenge", socket.nonce);
    });
    socket.on('calc-challenge', async (data) => {
        const saltRounds = 10;
    
        const hash = await bcrypt.hashSync(socket.challenge 
            + process.env.AUTH_SECRET 
            + socket.deviceId, saltRounds);

        if(hash == data.calc_challenge) {
            
            const token = jwt.sign({
                deviceId: socket.deviceId,
                name: user.name,
              }, process.env.JWT_SECRET, {
                expiresIn: '30m', // 30분
                issuer: 'stressy-middle',
              });
            io.emit('auth-success', token);
        } else{
            io.emit('auth-failed');
        }
    });vv

    socket.on("disconnect", () => {
        io.emit("user-disconnected");
    });
};