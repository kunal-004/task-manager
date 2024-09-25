const sgMail = require("@sendgrid/mail");

const SendGridApi = process.env.SENDGRID_API_KEY;

sgMail.setApiKey(SendGridApi);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "kunal61@gmail.com",
    subject: "Welcome to Task Manager App",
    text: `Hi ${name}, welcome to the app! Let me know if you need anything
        `,
  });
};

const sendCancellationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "kunal61@gmail.com",
    subject: "Task Manager App Cancellation",
    text: `Hi ${name}, you have cancelled your account. Let us know what happened`,
  });
};

module.exports = {
  sendWelcomeEmail,
  sendCancellationEmail,
};
