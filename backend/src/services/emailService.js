
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendShortlistEmail = async ({
  email,
  applicantName,
  jobTitle,
}) => {
  return transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Your application has been shortlisted - ${jobTitle}`,
    text: `Hello ${applicantName},

Congratulations! Your application for ${jobTitle} on Hirelume has been shortlisted.

Please log in to your Hirelume account to view your application and any further updates.

Best regards,
The Hirelume Team`,
  });
};

module.exports = { sendShortlistEmail };
