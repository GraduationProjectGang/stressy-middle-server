const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const url = require('url');
const fs = require('fs');
const router = require('router');

const { Device, Party, Token, User } = require('../models');
const { verifyTokenClient, verifyTokenGlobal } = require('./middleware');
const { RequestHeaderFieldsTooLarge } = require('http-errors');
// const { where } = require('sequelize/types');
const { resolveSoa } = require('dns');

router.post('/model/global/update', verifyTokenGlobal, async (req, res) => {
    const { model_weight, party_id } = req.body;
    try {
        const party = await Party.findOne({
            where: {
                id: party_id,
            },
        });
        
        if(!party){
            return res.status(304).json({
                code: 304,
                message: `cannot find party id:${party_id}`
            });
        }

        devices = await party.getDevices();
        for(deivce of devices){
            //update weight for each client
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: 'update failed',
        });
    }
});

router.post('/model/client/update', verifyTokenGlobal, async (req, res) => {
    const { fcm_token, device_id } = req.body;
    try {
      const device = await Device.findOne({
        where: {
          id: device_id,
        }, 
      });
      if(!device){
        return res.status(304).json({
          code: 304,
          message: 'Device not found',
        });
      }
      //TODO
      // const party = await party.findOne({
      //     where: {
      //         party: party,
      //     },
      // });
      // //SELECT * FROM parties where deviceId=${device_id} and where deletedAt is not null order by id desc limit 1;
      // if(!party){
      //
      // }

    } catch (error) {
        console.error(error);
        return res.status(500).json({
          code: 500,
          message: "error message"
        });
    }
});

router.post('/user/account/auth', async (req, res) => {
    const { user_email, user_pw, fcm_token } = req.body;
    try {
      const user = await User.findOne({
        where: { 
          email: user_email, 
          pw: user_pw,
        },
      });
      if (!user) {
        return res.status(304).json({
          code: 304,
          message: '등록되지 않은 유저입니다.',
        });
      }

      const token = await token.findOne({
          where: {
              token: fcm_token
          },
      });

      const token2 = jwt.sign({
        id: user.id,
        name: user.name,
      }, process.env.JWT_SECRET, {
        expiresIn: '30m', // 30분
        issuer: 'stressy-middle',
      });
      console.log(token)
      return res.json({
        code: 200,
        payload: JSON.stringify(user),
        message: '토큰이 발급되었습니다',
        token,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        code: 500,
        message: '서버 에러',
      });
    }
  });