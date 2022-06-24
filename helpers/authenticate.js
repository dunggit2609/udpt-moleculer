const apiResponse = require('./../helpers/apiResponse')

const jwt = require('jsonwebtoken');
const {access_token_secret} = require('../configs/authConfig')

const { userRepo } = require('../services/auth/repopsitory/userRepo');

const authenticate = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return apiResponse.forbiddenResponse(res)
        // return res
        //     .status(403)
        //     .send(getMessageForClient(res.statusCode, 'No token provided!', 0, null));
    }
    jwt.verify(token, access_token_secret, async (err, decoded) => {
        if (err) {
            console.log("err", err)
            return apiResponse.unauthorizedResponse(res)
        }
        // if (await userRepo.findById(decoded.user_id)) {
        //     return next();
        // }
        // return apiResponse.unauthorizedResponse(res)
        return next()
    });
};

module.exports = authenticate;