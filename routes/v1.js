//module
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const url = require('url');
const fs = require('fs');
const admin = require("firebase-admin");
const bcrypt = require('bcrypt');
const sr = require('secure-random');
const math = require('mathjs');
const { QueryTypes, Sequelize } = require('sequelize');
const paillierBigint = require('paillier-bigint');
const bcu = require('bigint-crypto-utils');
const randomInt = require('random-int');
require('log-timestamp');

// const math = require('mathjs');

const router = express.Router();

const logStr = "세지원 :";

const { Party, Token, User, sequelize } = require('../models');
const { verifyTokenClient, verifyTokenGlobal, requestGlobalModel } = require('./middleware');
const SALT_ROUND = 12;

dotenv.config();

//fcm init
var serviceAccount = require(".././serviceKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://datacollect-18877.firebaseio.com"
});

const CLIENT_THRESHOLD = 3;


router.post('/model/global/update', verifyTokenGlobal, async (req, res) => {
  const { model_weight, party_id } = req.body;
  try {
    //find party
    const party = await Party.findOne({
      where: {
        id: party_id,
      },
    });

    if (!party) {
      return res.status(304).json({
        code: 304,
        message: `cannot find party id:${party_id}`
      });
    }
    //Bring the devices that belongs to the party.
    const users = await party.getUsers();
    //iteration for FCM
    
    

    for await (user of users) {
      const registrationToken = await user.getToken();
      const message = {
        data: {
          //update weight for each client
          model_weight: model_weight,
          party_id: party_id,
        },
        registration_ids: registrationToken
      };
      //promise method for sending messages
      admin.messaging().send(message)
        .then((response) => {
          // Response is a message ID string.
          console.log('Successfully sent message:', response);
        })
        .catch((error) => {
          console.log('Error sending message:', error);
        });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: 'update failed',
    });
  }
});


router.post('/model/client/acknowledge', async (req, res) => {

  const { user_email, count, pk_n, pk_nSquared, pk_g } = req.body;
  // console.log(user_email, count, pk_n, pk_nSquared, pk_g);

  try {
    //find User
    const user = await User.findOne({
      where: {
        email: user_email,
      }
    });

    console.log(user);

    //if email is invalid
    if (!user) {
      return res.status(304).json({
        code: 304,
        message: 'user not found',
      });
    }

    let party = await Party.findAll({
      limit: 1,
      order: [ ['createdAt', 'DESC']],
    });
    
    console.log(party);

    let partySize = 0;
    let partyID = 0;

    //if the party does not exist
    if (party.length === 0) {
      console.log(logStr, "현재 인원이 남아있는 Party가 없으므로 새로운 Party 생성");
      //create new party
      party = await Party.create({
        size: 0,
      });

      partyID = party.id;
    }
    else {
      let party_first = party.pop();

      partySize = party_first.size;
      partyID = party_first.id;
      console.log(logStr, "Selected Party ID:", partyID);
      console.log(logStr, "Selected Party Size:", partySize);
    }
    const sizePadding = sr(1) * 0.1;
    const userID = user.id;

    //Add the current user to the party.
    await sequelize.query(
      "INSERT INTO user_party VALUES (NOW(), NOW(), :partyID, :userID, :count, :pk_n, :pk_nSquared, :pk_g, :sizePadding)",
      {
        replacements: { partyID, userID, count, pk_n, pk_nSquared, pk_g, sizePadding },
        type: QueryTypes.INSERT,
      }
    );

    console.log(logStr, `Party에 현재 user ${userID} 추가`);
    console.log(logStr, `user ${userID}'s Public Key(n) = ${pk_n}`);

    await sequelize.query(
      `UPDATE parties set size = ${partySize + 1} WHERE id = :partyID`,
      {
        replacements: { partyID },
        type: QueryTypes.UPDATE,
      }
    );
    
    partySize += 1;

    //if the party has exceeded the Threshold.
    //broadcast through FCM(Firebase Cloud Messaging) for members of the party to share key

    // TODO set parties.DeletedAt NULL
    if (partySize === CLIENT_THRESHOLD) {

      console.log(logStr, "Party size has exceeded the Threshold:", CLIENT_THRESHOLD);

      //use SELECT statements with inner join to find users who belong to Party;
      const users = await sequelize.query(
        "SELECT L.id, (SELECT tokenId FROM token WHERE id = L.tokenId) as tokenValue, R.dataCount as size, R.pk_n AS PK1, R.pk_nSquared AS PK2, R.pk_g AS PK3, R.sizePadding AS sizePadding from `users` AS L JOIN user_party AS R ON L.id = R.UserId WHERE R.partyId = :partyID;",
        {
          replacements: { partyID },
          type: QueryTypes.SELECT,
        }
      );
      
      await Party.destroy({
        where: { id: partyID }
      });

      console.log(logStr, "Destroy current party:", partyID);

      // 마스킹 테이블 작성
      let maskTable = math.identity(CLIENT_THRESHOLD);

      for (let i = 0; i < CLIENT_THRESHOLD; i++) {
        for (let j = i + 1; j < CLIENT_THRESHOLD; j++) {
          maskTable.subset(math.index(i, j), (sr(1)[0] + sr(1)[0] * 0.001));
        }
      }

      for (let i = 0; i < CLIENT_THRESHOLD; i++) {
        for (let j = 0; j < i; j++) {
          maskTable.subset(math.index(i, j), math.subset(maskTable, math.index(j, i)));
        }
      }
      console.log(logStr, "Masking Table 생성 :", maskTable);

      //저장해야 하는가? ㅇㅇ

      let publicKeys = [];

      let plainIndex = 0;
      let totalSize = 0;
      //encrypt indices
      axios.post(`http://localhost:49953/v1/size/${sizePadding}`)
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.error(err);
      });

      users.forEach((user) => {

        console.log(user);

        plainIndex += 1;
        totalSize += user.size;

        const n = BigInt(user.PK1);
        const nSquared = BigInt(user.PK2);
        const g = BigInt(user.PK3);
        const publicKey = new paillierBigint.PublicKey(n, g);
        
        // A*x + B = C

        const A = sr(1)[0];
        const B = sr(1)[0];
        const C = A * plainIndex + B;
        const encryptedIndexA = publicKey.encrypt(BigInt(A));
        const encryptedIndexB = publicKey.encrypt(BigInt(B));
        const encryptedIndexC = publicKey.encrypt(BigInt(C));

        user.encryptedIndex = encryptedIndexA + "," + encryptedIndexB + "," + encryptedIndexC;

        console.log(logStr, "Make A*x + B = C");
        console.log(logStr, `user ${user.id}'s A = ${A}, B = ${B}, C = ${C}`);
        console.log(logStr, `user ${user.id}'s encrypted A = ${encryptedIndexA}`);

        publicKeys.push({
          n: user.PK1,
          nSquared: user.PK2,
          g: user.PK3,
        });
      });
      
      for await (const user of users){
        let ratio = user.size / totalSize * sizePadding;
        let singleToken = [user.tokenValue, ];
  
        try {
          const jsonStr = JSON.stringify({ "maskTable": maskTable.toString(), "index": user.encryptedIndex, "ratio": ratio.toString(), "partyId": partyID.toString() });
          console.log(jsonStr);
          const msg = {
            data: { title: 'weightRequest', body: jsonStr },
            tokens: singleToken,
            priority: '10',
          };
  
          // console.log(msg.data);
  
          //send message
          admin.messaging().sendMulticast(msg)
              .then((response) => {
                  // Response is a message ID string.
                  console.log(logStr, `${user.id}에게 Aggregation Server에 Weight를 보내라고 지시:`, response);
              })
              .catch((error) => {
                  console.log(`to ${user.id}, Error sending message:`, error);
              });
              
          } catch (error) {
            console.log(error);
          }
      }
      
    }
    
    return res.status(201).json({
      code: 201,
      message: "accept acknowledge",
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      code: 500,
      message: "failed acknowledge"
    });
  }

});

//Called when users login 
router.post('/user/account/auth', async (req, res) => { 
    const { user_email, user_pw } = req.body;
    // console.log(user_email, user_pw);
    try {
      const hash = await bcrypt.hash(user_pw, SALT_ROUND);
      const user = await User.findOne({
        where: { 
          email: user_email,
        },
      });

      if (!user) {
        return res.status(404).json({
          code: 404,
          message: '등록되지 않은 유저입니다.',
        });
      }
      
      bcrypt.compare(user_pw, user.pw, function(err,result){
        if(result){
          const signedJWT = jwt.sign({
            id: user.id,
            email: user.email,
          }, process.env.JWT_SECRET, {
            expiresIn: '30000m', // 30000분
            issuer: 'stressy-middle',
          });
          //
          // console.log("user----------",user)
          const payload = JSON.parse(JSON.stringify(user));
          payload.pw = "";
          // console.log(signedJWT)
          return res.json({
            code: 200,
            payload,
            message: '토큰이 발급되었습니다',
            jwt: signedJWT,
            expiresIn: 30000,//30000분
          });
        }else{
          console.log(err);
          return res.status(501).json({
            code: 501,
            message: 'wrong password',
          });
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        code: 500,
        message: '서버 에러',
      });
    }
});

//on new fcm token
router.post('/user/fcm/newtoken', async (req, res) => {
  const { user_email, fcm_token } = req.body;
  console.log(req);

  try {
    let token = await Token.findOne({
      where: { tokenId: fcm_token }
    });

    console.log(`select * from token where tokenId='${fcm_token}'`);

    if (token) {
      return res.status(301).json({
        code: 301,
        message: '등록된 토큰 입니다.',
      });
    }
    
    const newToken = await Token.create({
      tokenId: fcm_token,
    });

    console.log(`insert into token values ${newToken}`);
    console.log(`${newToken['id']}`);

    return res.json({
      code: 200,
      payload: JSON.stringify(newToken),
      id:newToken['id']
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: '서버 에러',
    });
  }
});

//check if user's new email is valid
router.post('/user/account/validemail', async (req, res) => {
  const { user_email,  } = req.body;
  console.log(req);

  try {
    
    let user = await User.findAll({
      where: { email: user_email }
    });
    
    console.log(`select * from users where email='${user_email}'`);
    console.log(user.length);
    if(user.length){
      return res.status(503).json({
        code: 503,
        message: 'signed user',
      });
    }else{
      return res.status(200).json({
        code: 200,
        message: 'valid user',
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: '서버 에러',
    });
  }
});


router.post('/user/account/signup', async (req, res) => {
  const { user_email, user_pw, user_name, user_gender, user_bd, user_token,  } = req.body;
  try {
    
    let user = await User.findOne({
      where: { email: user_email }
    });
    const token = await Token.findOrCreate({
      where: { tokenId: user_token },
    });
    console.log(`select * from users where email='${user_email}'`);

    if(user){
      return res.status(202).json({
        code: 202,
        message: '등록된 유저 입니다.',
      });
    }
    const hash = await bcrypt.hash(user_pw, SALT_ROUND); 
    user = await User.create({
      email: user_email,
      pw: hash,
      name: user_name,
      gender: user_gender,
      birthday: user_bd,
      tokenId: user_token,
    });
   
    console.log(`insert into users values ${user}`);
    
    return res.json({
      code: 200,
      payload: JSON.stringify(user),
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: '서버 에러',
    });
  }
});

//change password
router.post('/user/account/changepw', async (req, res) => {
  //TODO
  const { user_email, new_pw } = req.body;
  const hash = await bcrypt.hash(new_pw, 12);
  try {
    let user = await User.findOne({
      where: { email: user_email }
    });

    console.log(`select * from users where email='${user_email}'`);

    //아주 뇌피셜임
    const this_user = await user.update({
      pw: hash
    });

    console.log(`update pw where email = ${user_email}`);

    return res.json({
      code: 200,
      payload: JSON.stringify(this_user),
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: '서버 에러',
    });
  }
});

//change password
router.post('/user/account/withdraw', async (req, res) => {
  //delete user from User
  const { user_email, fcm_token } = req.body;
  try {
    let user = await User.destroy({
      where: { email: user_email }
    });

    console.log(`delete from users where email='${user_email}'`);

    res.json({
      code: 200,
      message: "deleted successfully",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: 'server error',
    });
  }

  //delete token from Token

  try {
    let token = await Token.destroy({
      where: { tokenId: fcm_token }
    });

    console.log(`delete from users where tokenId='${fcm_token}'`);

    return res.json({
      code: 200,
      message: "deleted successfully",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: 'server error',
    });
  }
});

module.exports = router;