const nodemailer = require('nodemailer');

const sendResetEmail = async (user, resetToken) => {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        to: user.email,
        from: process.env.EMAIL_USER,
        subject: 'Password Reset',
        text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.
        Please click on the following link, or paste this into your browser to complete the process:
        ${process.env.CLIENT_URL}/api/auth/reset-password?token=${resetToken}
        If you did not request this, please ignore this email and your password will remain unchanged.`
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendResetEmail;