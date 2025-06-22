const fs = require('fs');
const path = require('path');
const { transporter } = require('../../config/mail.config');


const sendMunicipalityApprovedEmail = async (to, municipalityName) => {
    const templatePath = path.join(__dirname, '../..', 'templates', 'municipalityApprove.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');
    htmlContent = htmlContent.replace('{{municipalityName}}', municipalityName);

    const mailOptions = {
        from: `"Echo Sudhra" <${process.env.MAIL_USER}>`,
        to,
        subject: 'Approve mail',
        html: htmlContent,
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (err) {
        console.error('Failed to send Approve email:', err);
        throw new Error('Failed to send Approve Mail');
    }
};

const sendMunicipalityRejectEmail = async (to, municipalityName, rejectionReason) => {
    const templatePath = path.join(__dirname, '../..', 'templates', 'municipalityRejection.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    htmlContent = htmlContent.replace('{{municipalityName}}', municipalityName);
    htmlContent = htmlContent.replace('{{rejectionReason}}', rejectionReason);

    const mailOptions = {
        from: `"Echo Sudhra" <${process.env.MAIL_USER}>`,
        to,
        subject: 'Rejection mail',
        html: htmlContent,
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (err) {
        console.error('Failed to send Rejection email:', err);
        throw new Error('Failed to send Rejection Mail');
    }
};



module.exports = {
    sendMunicipalityApprovedEmail,
    sendMunicipalityRejectEmail,
};
