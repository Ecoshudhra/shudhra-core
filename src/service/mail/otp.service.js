const fs = require('fs');
const path = require('path');
const { transporter } = require('../../config/mail.config');


const sendOtpEmail = async (to, otp) => {
  const templatePath = path.join(__dirname, '../..', 'templates', 'otp.html');
  let htmlContent = fs.readFileSync(templatePath, 'utf8');
  htmlContent = htmlContent.replace('{{OTP}}', otp);

  const mailOptions = {
    from: `"YourApp" <${process.env.MAIL_USER}>`,
    to,
    subject: 'Your OTP Code',
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.error('Failed to send OTP email:', err);
    throw new Error('Failed to send OTP');
  }
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
  sendOtpEmail,
  generateOtp,
};
