const nodemailer = require("nodemailer");
const googleApis = require("googleapis");

const REDIRECT_URI = `https://developers.google.com/oauthplayground`;
const CLIENT_ID = `305289313503-650450lv8lb26nv9v60tg9n91q4gret0.apps.googleusercontent.com`;
const CLIENT_SECRET = `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`;
const REFRESH_TOKEN = `1//04dzQCCf75RIaCgYIARAAGAQSNwF-L9Irhkj6jp96RpN88bEEU1PtYLCcnHu5DDnUXdig4pjAlpozRCdhHHRxuqnOjaFKOht5rTA`;

const authClient = new googleApis.google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET,
    REDIRECT_URI);
authClient.setCredentials({ refresh_token: REFRESH_TOKEN });

async function mailer(receiver, id, key) {
    try {
        const ACCESS_TOKEN = await authClient.getAccessToken();

        const transport = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: "pummysahu04@gmail.com",
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: ACCESS_TOKEN
            }
        })
        const details = {
            from: "Pummy sahu <pummysahu04@gmail.com>",
            to: receiver,
            subject: "kuchh bhi likh do",
            text: "message text",
            html:`you can recover your account by click following link <a href="http://localhost:3000/forgot/${id}/${key}"> localhost:3000/forgot/${id}/${key}</a>`
        }
        const result = await transport.sendMail(details);
        return result;
    }
    catch (err) {
        return err;
    }
}

module.exports = mailer