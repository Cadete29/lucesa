// backend/utils/emailServiceG.js
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const nodemailer = require('nodemailer');

/**
 * Carga y compila una plantilla HTML
 */
const loadTemplate = (templateName, data) => {
    try {
        const filepath = path.join(__dirname, `../templates/${templateName}.html`);
        
        // Verificar si el archivo existe
        if (!fs.existsSync(filepath)) {
            throw new Error(`Plantilla ${templateName}.html no encontrada`);
        }
        
        const source = fs.readFileSync(filepath, 'utf-8');
        const template = handlebars.compile(source);
        return template(data);
    } catch (error) {
        console.error(`Error cargando plantilla ${templateName}:`, error);
        
        // Plantilla de respaldo profesional
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
                    .content { padding: 40px 30px; background: #ffffff; }
                    .button { display: inline-block; padding: 16px 32px; background: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 25px 0; }
                    .footer { text-align: center; padding: 25px; color: #666; font-size: 13px; background: #f8f9fa; }
                    .token-info { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #4F46E5; }
                    .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 15px 0; color: #856404; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0; font-size: 28px;">🔐 Lucesa</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">Recuperación de Contraseña</p>
                    </div>
                    <div class="content">
                        <h2 style="color: #333; margin-bottom: 20px;">Hola ${data.username},</h2>
                        <p>Has solicitado restablecer tu contraseña en <strong>Lucesa</strong>.</p>
                        <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                        
                        <div style="text-align: center;">
                            <a href="${data.resetLink}" class="button">Restablecer Contraseña</a>
                        </div>
                        
                        <div class="token-info">
                            <p style="margin: 0; font-size: 14px;"><strong>⚠️ Importante:</strong> Este enlace expirará en <strong>1 hora</strong> por seguridad.</p>
                        </div>
                        
                        <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                        <p style="word-break: break-all; background: #f8f9fa; padding: 12px; border-radius: 4px; font-size: 14px;">
                            <a href="${data.resetLink}" style="color: #4F46E5; text-decoration: none;">${data.resetLink}</a>
                        </p>
                        
                        <div class="warning">
                            <p style="margin: 0;"><strong>🔒 Seguridad:</strong> Si no solicitaste este cambio, por favor ignora este mensaje. Tu cuenta permanecerá segura.</p>
                        </div>
                    </div>
                    <div class="footer">
                        <p style="margin: 0;">&copy; ${data.currentYear} Lucesa. Todos los derechos reservados.</p>
                        <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.7;">
                            Este es un mensaje automático, por favor no respondas a este correo.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
};

/**
 * Configuración del transporter de correo para producción
 */
const createTransporter = () => {
    // Verificar que las variables de entorno estén configuradas
    if (!process.env.EMAIL_USER) {
        throw new Error('EMAIL_USER no está configurado en las variables de entorno');
    }
    
    if (!process.env.EMAIL_PASSWORD) {
        throw new Error('EMAIL_PASSWORD no está configurado en las variables de entorno');
    }

    console.log('📧 Configurando transporter de correo para producción...');
    console.log('📍 Email:', process.env.EMAIL_USER);
    
    try {
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false
            },
        });

        // Verificar la configuración
        console.log('🔄 Verificando configuración del transporter...');
        
        return transporter;
    } catch (error) {
        console.error('❌ Error creando transporter:', error);
        throw new Error(`No se pudo configurar el servicio de correo: ${error.message}`);
    }
};

const transporter = createTransporter();

/**
 * Verifica la conexión del transporter
 */
const verifyTransporter = async () => {
    try {
        await transporter.verify();
        console.log('✅ Transporter de correo configurado correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error verificando transporter:', error);
        throw new Error(`Falló la verificación del servicio de correo: ${error.message}`);
    }
};

// Verificar el transporter al iniciar
verifyTransporter().catch(console.error);

/**
 * Envía correo de recuperación de contraseña
 */
const sendPasswordResetEmailG = async (email, username, token) => {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    console.log('\n📧 ===== ENVIANDO CORREO DE RECUPERACIÓN =====');
    console.log('📍 Para:', email);
    console.log('👤 Usuario:', username);
    console.log('🔗 Enlace:', resetLink);
    console.log('🌍 Entorno: PRODUCCIÓN');

    const html = loadTemplate('reset-password', {
        username: username || 'Usuario',
        resetLink,
        currentYear: new Date().getFullYear()
    });

    const mailOptions = {
        from: `"${process.env.EMAIL_SENDER_NAME || 'Lucesa'}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔑 Restablece tu contraseña - Lucesa',
        html: html,
        text: `Hola ${username},\n\nHas solicitado restablecer tu contraseña en Lucesa.\n\nHaz clic en el siguiente enlace para crear una nueva contraseña:\n${resetLink}\n\nEste enlace expirará en 1 hora.\n\nSi no solicitaste este cambio, ignora este mensaje.\n\nSaludos,\nEquipo Lucesa`,
    };

    try {
        console.log('🔄 Enviando correo real...');
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ CORREO ENVIADO EXITOSAMENTE');
        console.log('   📨 ID del mensaje:', info.messageId);
        console.log('   📬 Respuesta:', info.response);
        console.log('   👤 Destinatario:', email);
        console.log('==========================================\n');
        
        return { 
            success: true, 
            mode: 'production', 
            messageId: info.messageId,
            response: info.response
        };

    } catch (error) {
        console.error('❌ ERROR ENVIANDO CORREO:', error);
        console.log('==========================================\n');
        
        throw new Error(`No se pudo enviar el correo de recuperación: ${error.message}`);
    }
};

/**
 * Envía correo de bienvenida
 */
const sendWelcomeEmailG = async (email, username) => {
    console.log('📧 Enviando correo de bienvenida a:', email);

    try {
        const html = loadTemplate('welcome', {
            username,
            frontendUrl: process.env.FRONTEND_URL,
            currentYear: new Date().getFullYear()
        });

        const mailOptions = {
            from: `"${process.env.EMAIL_SENDER_NAME || 'Lucesa'}" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '¡Bienvenido a Lucesa!',
            html: html,
            text: `¡Hola ${username}! Tu cuenta ha sido creada exitosamente. Ve a ${process.env.FRONTEND_URL} para empezar a personalizar tu perfil.`,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Correo de bienvenida enviado a:', email);
        
        return { 
            success: true, 
            mode: 'production', 
            messageId: info.messageId 
        };

    } catch (error) {
        console.error('❌ Error enviando correo de bienvenida:', error);
        throw new Error(`No se pudo enviar el correo de bienvenida: ${error.message}`);
    }
};

module.exports = {
    sendPasswordResetEmailG,
    sendWelcomeEmailG
};