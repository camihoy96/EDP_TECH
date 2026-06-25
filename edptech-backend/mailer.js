// mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendPasswordResetEmail(email, code, username) {
    const mailOptions = {
        from: process.env.EMAIL_FROM || 'EDPtech Helpdesk <Leeplaza@edptech.com>',
        to: email,
        subject: '🔑 Password Reset Code - EDPtech Helpdesk',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                <div style="background: #0a246a; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h2 style="color: white; margin: 0;">🔑 Password Reset</h2>
                </div>
                <div style="background: #f8f9fa; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
                    <p>Hello${username ? ' <strong>' + username + '</strong>' : ''},</p>
                    <p>You requested a password reset for your EDPtech Helpdesk account.</p>
                    
                    <div style="background: white; border: 2px dashed #0a246a; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
                        <p style="margin: 0; font-size: 12px; color: #888;">YOUR RESET CODE</p>
                        <p style="margin: 8px 0; font-size: 32px; font-weight: bold; color: #0a246a; letter-spacing: 8px;">${code}</p>
                    </div>
                    
                    <p style="font-size: 12px; color: #888;">This code expires in <strong>15 minutes</strong>.</p>
                    <p style="font-size: 12px; color: #888;">If you didn't request this, please ignore this email.</p>
                    
                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                    <p style="font-size: 10px; color: #aaa; text-align: center;">
                        EDPtech Helpdesk System v2.0<br>
                        This is an automated message. Please do not reply.
                    </p>
                </div>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
}

module.exports = { sendPasswordResetEmail };