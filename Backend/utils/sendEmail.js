const nodemailer = require('nodemailer');
require('dotenv').config();

const sendConfirmationEmail = async (to, verificationToken) => {
    // Create a transporter using Gmail service
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,  
            pass: process.env.EMAIL_PASS   
        }
    });

    // Generate the verification link using the CLIENT_URL and token
    const confirmationLink = `${process.env.CLIENT_URL}/api/auth/verify-email?token=${verificationToken}`;

    // Setup email options
    const mailOptions = {
        from: process.env.EMAIL_USER, 
        to,
        subject: "Confirm Your Email Address",
        text: `Hello,

Please confirm your email address by clicking the link below:
${confirmationLink}

If you did not sign up for this account, please ignore this email.

Thanks,`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2>Welcome!</h2>
                <p>Thank you for signing up. Please confirm your email address to complete your registration.</p>
                <a href="${confirmationLink}" 
                   style="display: inline-block; padding: 10px 20px; margin: 20px 0; 
                          background-color: #4CAF50; color: #fff; text-decoration: none; border-radius: 5px;">
                    Confirm Email
                </a>
                <p>If the button above does not work, copy and paste the following URL into your browser:</p>
                <p>${confirmationLink}</p>
                <p>Best regards,</p>
            </div>
        `
    };

    // Send the email
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.response);
    } catch (error) {
        console.error("Error sending email:", error);
    }
};

module.exports = sendConfirmationEmail;
