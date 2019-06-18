// install sendgrid = `npm i @sendgrid/mail`
const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'mediamergugun2@gmail.com',
        subject: 'Thanks for joining in!',
        text: `welcome to the app, ${name}. Let me know how you get along with the app.`
    })
}

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'mediamergugun2@gmail.com',
        subject: `Good bye ${name}`,
        text: `See you in another chance, ${name}.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}
