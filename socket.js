const SocketIO = require('socket.io');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const mathjs = require('mathjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

dotenv.config();
const prime = 179424673;
const algorithm = 'aes-192-cbc';
const saltRounds = 10;
const iv = Buffer.alloc(16, 0); // Initialization vector.

//key generation
const key = crypto.scryptSync(env.process.AUTH_SECRET, 'salt', saltRounds);
//create symmetric cipher
const cipher = crypto.createCipheriv(algorithm, key, iv);

//socket io module
module.exports = (server, app, sessionMiddleware) => {
    const io = SocketIO(server, { path: '/socket.io '});
    app.set('io', io);
    io.use((socket, next) => {
        sessionMiddleware(socket.request, socket.request.res, next);
    });
    io.on('connection', (socket) => {
        const req = socket.request;
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        
        //define namespace
        const auth = io.of('/auth');

        //error
        socket.on('error', (error) => {
            console.log(error);
        });

        //disconnect
        socket.on("disconnect", () => {
            console.log("user-disconnected");
            io.emit("user-disconnected");
        });         
        
        //auth socket
        //user connection establish
        auth.on('connection', (sokcet) => {
            
            socket.nonce = mathjs.randomInt(0, prime);
            socket.deviceId = data.deviceId;
            //send challenge before a connection is opend
            io.emit("send-challenge", socket.nonce);
        });
    
        //When the challenge calculation is complete
        auth.on('calc-challenge', async (socket) => {
            const saltRounds = 10;
            
            const key = await bcrypt.hashSync(socket.challenge 
                + process.env.AUTH_SECRET 
                + socket.deviceId, saltRounds);
    
            //validate calc-challenge
            if(hash == data.calc_challenge) {
                const token = jwt.sign({
                    deviceId: socket.deviceId,
                    name: user.name,
                  }, process.env.JWT_SECRET, {
                    expiresIn: '30m', // 30분
                    issuer: 'stressy-middle',
                });
                //encrytion with symmetirc chipher
                let encrypted = cipher.update(token, 'utf8', 'hex');
                encrypted += cipher.final('hex');

                console.log(encrypted);

                //send encrypted token
                io.emit('connection-success', encrypted);
            } else{
                //connection failed
                io.emit('connection-failed', "invalid token");
            }
        });
        
        
    });
}
