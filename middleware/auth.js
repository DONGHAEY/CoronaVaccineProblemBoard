const { User } = require("../models/user");

const auth = (token, cb) => {
    User.findByToken(token, (err, user) => {
        cb(err, user);
    })
}

module.exports = { auth };