const crypto = require('crypto');

const generateVerificationToken = () => {
    const verificationToken = crypto.randomBytes(20).toString('hex');
    const verificationTokenExpires = Date.now() + 3600000; // 1 hour
    return { verificationToken, verificationTokenExpires };
};

module.exports = generateVerificationToken;