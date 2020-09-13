const jwt = require('jsonwebtoken');



exports.verifyTokenClient = (req, res, next) => {
    try {
      req.decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
      console.log(req.decoded);
      return next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') { // 유효기간 초과
        return res.status(419).json({
          code: 419,
          message: 'expired token',
        });
      }
      return res.status(401).json({
        code: 401,
        message: 'invalid token',
      });
    }
  };

exports.verifyTokenGlobal = (req, res, next) => {
    try {
      req.decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET_GLOBAL);
      console.log(req.decoded);
      return next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') { // 유효기간 초과
        return res.status(419).json({
          code: 419,
          message: 'expired token',
        });
      }
      return res.status(401).json({
        code: 401,
        message: 'invalid token',
      });
    }
  };