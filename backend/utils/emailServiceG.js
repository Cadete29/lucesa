// backend/utils/emailServiceG.js
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const nodemailer = require('nodemailer');

const loadTemplate = (templateName, data) => {
    const filepath = path.join(__dirname, `../templates/${templateName}.html`);
    const source = fs.readFileSync(filepath, 'utf-8');
    const template = handlebars.compile(source);
    return template(data);
};

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,   // ← contraseña de app de Google
    },
    tls: {
        rejectUnauthorized: false
    },
});

const sendPasswordResetEmailG = async (email, username, token) => {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    const html = loadTemplate('reset-password', {
        username,
        resetLink,
        currentYear: new Date().getFullYear()
    });

    try {
        await transporter.sendMail({
            from: `"${process.env.EMAIL_SENDER_NAME}" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🔑 Restablece tu contraseña - Lucesa',
            html,
            text: `Hola ${username}, haz clic para restablecer tu contraseña: ${resetLink} (válido por 1 hora)`,
        });
        console.log(`Correo de reseteo enviado a ${email}`);
    } catch (error) {
        console.error('Error enviando correo de reseteo:', error);
        throw error;
    }
};

const sendWelcomeEmailG = async (email, username) => {
    try {
        const html = loadTemplate('welcome', {
            username,
            frontendUrl: process.env.FRONTEND_URL,
            currentYear: new Date().getFullYear()
        });

        await transporter.sendMail({
            from: `"${process.env.EMAIL_SENDER_NAME}" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '¡Bienvenido a Lucesa!',
            html,
            text: `¡Hola ${username}! Tu cuenta ha sido creada. Ve a ${process.env.FRONTEND_URL} para empezar a personalizar tu perfil.`,
        });

        console.log(`Correo de bienvenida enviado a: ${email}`);
    } catch (error) {
        console.error('Error enviando correo de bienvenida:', error);
        throw error;
    }
};

module.exports = {
    sendPasswordResetEmailG,
    sendWelcomeEmailG
};