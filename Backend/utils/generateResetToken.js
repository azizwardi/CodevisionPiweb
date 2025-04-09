const crypto = require('crypto');

const generateResetToken = () => {
    return crypto.randomBytes(20).toString('hex');
};

module.exports = generateResetToken;