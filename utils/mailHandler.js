const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    secure: false, // Use true for port 465, false for port 587
    auth: {
        user: "f46271a1e5f1c9",
        pass: "0c5d6df96df8dc",
    },
});

module.exports = {
    sendMail: async (to, url) => {
        const info = await transporter.sendMail({
            from: 'Admin@hahah.com',
            to: to,
            subject: "request resetpassword email",
            text: "click vao day de reset", // Plain-text version of the message
            html: "click vao <a href=" + url + ">day</a> de reset", // HTML version of the message
        });

        console.log("Message sent:", info.messageId);
    },
    sendPasswordEmail: async (to, username, password) => {
        try {
            const info = await transporter.sendMail({
                from: 'Admin@hahah.com',
                to: to,
                subject: "Your New Account Details",
                text: `Hello ${username}, your password is: ${password}`,
                html: `<p>Hello <b>${username}</b>,</p><p>Your account has been created.</p><p>Your password is: <b>${password}</b></p>`,
            });
            console.log("Password email sent:", info.messageId);
        } catch (err) {
            console.error("Error sending password email", err);
        }
    }
}