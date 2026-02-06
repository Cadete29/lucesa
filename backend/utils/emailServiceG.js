// backend/utils/emailServiceG.js - COMPLETO CORREGIDO CON TRANSFERENCIAS
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
            console.warn(`⚠️ Plantilla ${templateName}.html no encontrada en: ${filepath}`);
            throw new Error(`Plantilla ${templateName}.html no encontrada`);
        }
        
        const source = fs.readFileSync(filepath, 'utf-8');
        const template = handlebars.compile(source);
        return template(data);
    } catch (error) {
        console.error(`❌ Error cargando plantilla ${templateName}:`, error);
        
        // Plantilla de respaldo profesional
        return createFallbackTemplate(templateName, data);
    }
};

/**
 * Crea una plantilla de respaldo basada en el tipo
 */
const createFallbackTemplate = (templateName, data) => {
    console.log(`🔄 Usando plantilla de respaldo para: ${templateName}`);
    
    const currentYear = new Date().getFullYear();
    const username = data.username || 'Usuario';
    const buyerName = data.buyerName || 'Cliente';
    const orderNumber = data.orderNumber || 'N/A';
    const orderDate = data.orderDate || new Date().toLocaleDateString('es-MX');
    const totalAmount = data.totalAmount || '0.00';
    const paymentMethod = data.paymentMethod || 'Mercado Pago';
    const frontendUrl = data.frontendUrl || 'https://lucesademexico-shop.com.mx';
    const orderLink = data.orderLink || `${frontendUrl}//my-account`;
    const resetLink = data.resetLink || `${frontendUrl}/reset-password`;
    const sellerName = data.sellerName || 'Administrador';
    const buyerEmail = data.buyerEmail || 'No disponible';
    const shippingInfo = data.shippingInfo || 'No especificada';
    
    const templates = {
        'reset-password': `<!DOCTYPE html>
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
            <h2 style="color: #333; margin-bottom: 20px;">Hola ${username},</h2>
            <p>Has solicitado restablecer tu contraseña en <strong>Lucesa</strong>.</p>
            <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
            
            <div style="text-align: center;">
                <a href="${resetLink}" class="button">Restablecer Contraseña</a>
            </div>
            
            <div class="token-info">
                <p style="margin: 0; font-size: 14px;"><strong>⚠️ Importante:</strong> Este enlace expirará en <strong>1 hora</strong> por seguridad.</p>
            </div>
            
            <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; background: #f8f9fa; padding: 12px; border-radius: 4px; font-size: 14px;">
                <a href="${resetLink}" style="color: #4F46E5; text-decoration: none;">${resetLink}</a>
            </p>
            
            <div class="warning">
                <p style="margin: 0;"><strong>🔒 Seguridad:</strong> Si no solicitaste este cambio, por favor ignora este mensaje. Tu cuenta permanecerá segura.</p>
            </div>
        </div>
        <div class="footer">
            <p style="margin: 0;">&copy; ${currentYear} Lucesa. Todos los derechos reservados.</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.7;">
                Este es un mensaje automático, por favor no respondas a este correo.
            </p>
        </div>
    </div>
</body>
</html>`,
        
        'welcome': `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); color: white; padding: 40px 20px; text-align: center; }
        .content { padding: 40px 30px; background: #ffffff; }
        .button { display: inline-block; padding: 16px 32px; background: #4CAF50; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 25px 0; }
        .features { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
        .feature { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; }
        .feature-icon { font-size: 32px; margin-bottom: 15px; }
        .feature-title { font-weight: bold; margin-bottom: 10px; color: #2E7D32; }
        .footer { text-align: center; padding: 25px; color: #666; font-size: 13px; background: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🎉 ¡Bienvenido a Lucesa!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Tu cuenta ha sido creada exitosamente</p>
        </div>
        <div class="content">
            <h2 style="color: #333; margin-bottom: 20px;">Hola ${username},</h2>
            <p>Nos alegra mucho que te hayas unido a la comunidad de <strong>Lucesa</strong>.</p>
            <p>Ahora puedes acceder a todos nuestros productos y servicios:</p>
            
            <div class="features">
                <div class="feature">
                    <div class="feature-icon">🛒</div>
                    <div class="feature-title">Compra en línea</div>
                    <p>Explora nuestro catálogo completo de productos</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">📦</div>
                    <div class="feature-title">Seguimiento de pedidos</div>
                    <p>Monitorea el estado de tus compras en tiempo real</p>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="${frontendUrl}" class="button">Comenzar a Comprar</a>
            </div>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
                <strong>Consejo:</strong> Completa tu perfil para una mejor experiencia de compra.
            </p>
        </div>
        <div class="footer">
            <p style="margin: 0;">&copy; ${currentYear} Lucesa. Todos los derechos reservados.</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.7;">
                Este es un mensaje automático, por favor no respondas a este correo.
            </p>
        </div>
    </div>
</body>
</html>`,
        
        'order-buyer': `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmación de Pedido - Lucesa</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            margin-bottom: 30px;
        }
        
        .greeting h2 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 10px;
        }
        
        .order-info {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 30px;
            border-left: 4px solid #4CAF50;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .info-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        
        .info-label {
            font-weight: 600;
            color: #555555;
        }
        
        .info-value {
            color: #333333;
        }
        
        .products-section {
            margin: 30px 0;
        }
        
        .products-section h3 {
            color: #333333;
            margin-bottom: 20px;
            font-size: 20px;
        }
        
        .product-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .product-item:last-child {
            border-bottom: none;
        }
        
        .product-name {
            flex: 2;
            font-weight: 500;
        }
        
        .product-details {
            flex: 2;
            color: #666666;
            font-size: 14px;
        }
        
        .product-quantity {
            flex: 1;
            text-align: center;
        }
        
        .product-price {
            flex: 1;
            text-align: right;
            font-weight: 600;
        }
        
        .total-section {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 25px;
            margin: 30px 0;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            font-size: 16px;
        }
        
        .grand-total {
            font-size: 20px;
            font-weight: 700;
            color: #2E7D32;
            border-top: 2px solid #e0e0e0;
            padding-top: 15px;
            margin-top: 15px;
        }
        
        .cta-button {
            display: inline-block;
            background: #4CAF50;
            color: white;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: background-color 0.3s;
        }
        
        .cta-button:hover {
            background: #3d8b40;
        }
        
        .button-container {
            text-align: center;
            margin: 40px 0 30px 0;
        }
        
        .footer {
            text-align: center;
            padding: 30px;
            color: #666666;
            font-size: 14px;
            background: #f8f9fa;
            border-top: 1px solid #e0e0e0;
        }
        
        .footer p {
            margin: 5px 0;
        }
        
        .footer a {
            color: #4CAF50;
            text-decoration: none;
        }
        
        @media (max-width: 600px) {
            .container {
                border-radius: 0;
            }
            
            .content {
                padding: 20px 15px;
            }
            
            .product-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 5px;
            }
            
            .product-quantity, .product-price {
                text-align: left;
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ ¡Pedido Confirmado!</h1>
            <p>Gracias por tu compra en Lucesa</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                <h2>Hola ${buyerName},</h2>
                <p>Tu pedido ha sido confirmado exitosamente. A continuación encontrarás el resumen de tu compra.</p>
            </div>
            
            <div class="order-info">
                <div class="info-row">
                    <span class="info-label">Número de orden:</span>
                    <span class="info-value">${orderNumber}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Fecha:</span>
                    <span class="info-value">${orderDate}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Estado:</span>
                    <span class="info-value" style="color: #4CAF50; font-weight: 600;">Confirmado</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Método de pago:</span>
                    <span class="info-value">${paymentMethod}</span>
                </div>
            </div>
            
            <div class="button-container">
                <a href="${orderLink}" class="cta-button">Ver detalle de mi pedido</a>
            </div>
            
            <div class="total-section">
                <div class="total-row grand-total">
                    <span>Total:</span>
                    <span>$${totalAmount} MXN</span>
                </div>
            </div>
            
            <p style="color: #666666; font-size: 14px; text-align: center; margin-top: 20px;">
                Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos.
            </p>
        </div>
        
        <div class="footer">
            <p>&copy; ${currentYear} Lucesa. Todos los derechos reservados.</p>
            <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
            <p><a href="${frontendUrl}">Visita nuestra tienda</a></p>
        </div>
    </div>
</body>
</html>`,
        
        'order-seller': `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nueva Orden - Lucesa</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .alert-banner {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 30px;
            color: #856404;
        }
        
        .alert-banner strong {
            display: block;
            margin-bottom: 5px;
        }
        
        .order-summary {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 30px;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 25px;
        }
        
        .summary-item label {
            display: block;
            color: #666666;
            font-size: 14px;
            margin-bottom: 5px;
        }
        
        .summary-item span {
            display: block;
            font-weight: 600;
            color: #333333;
        }
        
        .customer-info {
            background: #e8f4fd;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #2196F3;
        }
        
        .products-table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
        }
        
        .products-table th {
            background: #f8f9fa;
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
            color: #333333;
            border-bottom: 2px solid #e0e0e0;
        }
        
        .products-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .products-table tr:last-child td {
            border-bottom: none;
        }
        
        .total-row {
            font-weight: 700;
            font-size: 18px;
            color: #1976D2;
        }
        
        .cta-button {
            display: inline-block;
            background: #2196F3;
            color: white;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: background-color 0.3s;
        }
        
        .cta-button:hover {
            background: #0b7dda;
        }
        
        .button-container {
            text-align: center;
            margin: 40px 0 30px 0;
        }
        
        .footer {
            text-align: center;
            padding: 30px;
            color: #666666;
            font-size: 14px;
            background: #f8f9fa;
            border-top: 1px solid #e0e0e0;
        }
        
        @media (max-width: 600px) {
            .container {
                border-radius: 0;
            }
            
            .content {
                padding: 20px 15px;
            }
            
            .summary-grid {
                grid-template-columns: 1fr;
                gap: 10px;
            }
            
            .products-table {
                display: block;
                overflow-x: auto;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛒 Nueva Orden Recibida</h1>
            <p>Lucesa - Sistema de Ventas</p>
        </div>
        
        <div class="content">
            <div class="alert-banner">
                <strong>⚠️ ACCIÓN REQUERIDA</strong>
                <p>Se ha recibido una nueva orden que requiere tu atención.</p>
            </div>
            
            <h2 style="color: #333333; margin-bottom: 25px;">Hola ${sellerName},</h2>
            <p style="margin-bottom: 20px;">Has recibido una nueva orden de compra. Aquí están los detalles:</p>
            
            <div class="order-summary">
                <h3 style="color: #333333; margin-bottom: 20px;">Resumen de la Orden</h3>
                
                <div class="summary-grid">
                    <div class="summary-item">
                        <label>Número de orden</label>
                        <span>${orderNumber}</span>
                    </div>
                    <div class="summary-item">
                        <label>Fecha</label>
                        <span>${orderDate}</span>
                    </div>
                    <div class="summary-item">
                        <label>Total</label>
                        <span style="color: #1976D2; font-size: 18px;">$${totalAmount} MXN</span>
                    </div>
                    <div class="summary-item">
                        <label>Estado</label>
                        <span style="color: #4CAF50; font-weight: 600;">Pendiente</span>
                    </div>
                </div>
            </div>
            
            <div class="customer-info">
                <h4 style="color: #2196F3; margin-bottom: 10px;">Información del Cliente</h4>
                <p><strong>Nombre:</strong> ${buyerName}</p>
                <p><strong>Email:</strong> ${buyerEmail}</p>
                <p><strong>Dirección de envío:</strong> ${shippingInfo}</p>
            </div>
            
            <div class="button-container">
                <a href="https://lucesademexico-shop.com.mx/my-account" class="cta-button">Ver orden en panel de administración</a>
            </div>
            
            <p style="color: #666666; font-size: 14px; text-align: center; margin-top: 20px;">
                Por favor procesa esta orden lo antes posible.
            </p>
        </div>
        
        <div class="footer">
            <p>&copy; ${currentYear} Lucesa. Todos los derechos reservados.</p>
            <p>Este es un mensaje automático del sistema de ventas.</p>
        </div>
    </div>
</body>
</html>`
    };
    
    return templates[templateName] || `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Lucesa - Notificación</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Lucesa</h1>
        </div>
        <div class="content">
            <h2>Notificación del Sistema</h2>
            <p>${JSON.stringify(data, null, 2)}</p>
        </div>
        <div class="footer">
            <p>&copy; ${currentYear} Lucesa</p>
        </div>
    </div>
</body>
</html>`;
};

/**
 * Configuración del transporter de correo para producción
 */
let transporter = null;

const createTransporter = () => {
    if (transporter) return transporter;
    
    // Verificar que las variables de entorno estén configuradas
    if (!process.env.EMAIL_USER) {
        console.error('❌ EMAIL_USER no está configurado en las variables de entorno');
        throw new Error('EMAIL_USER no está configurado en las variables de entorno');
    }
    
    if (!process.env.EMAIL_PASSWORD) {
        console.error('❌ EMAIL_PASSWORD no está configurado en las variables de entorno');
        throw new Error('EMAIL_PASSWORD no está configurado en las variables de entorno');
    }

    console.log('📧 Configurando transporter de correo para producción...');
    console.log('📍 Email:', process.env.EMAIL_USER);
    
    try {
        transporter = nodemailer.createTransport({
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

        console.log('✅ Transporter configurado exitosamente');
        return transporter;
    } catch (error) {
        console.error('❌ Error creando transporter:', error);
        throw new Error(`No se pudo configurar el servicio de correo: ${error.message}`);
    }
};

/**
 * Verifica la conexión del transporter
 */
const verifyTransporter = async () => {
    try {
        if (!transporter) {
            transporter = createTransporter();
        }
        
        await transporter.verify();
        console.log('✅ Transporter de correo configurado correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error verificando transporter:', error);
        throw new Error(`Falló la verificación del servicio de correo: ${error.message}`);
    }
};

// Verificar el transporter al iniciar
verifyTransporter().catch(error => {
    console.error('⚠️ No se pudo verificar el transporter al iniciar:', error.message);
});

/**
 * Obtiene transporter (lazy loading)
 */
const getTransporter = () => {
    if (!transporter) {
        return createTransporter();
    }
    return transporter;
};

/**
 * Envía correo de recuperación de contraseña
 */
const sendPasswordResetEmailG = async (email, username, token) => {
    try {
        const resetLink = `${process.env.FRONTEND_URL || 'https://lucesademexico-shop.com.mx'}/reset-password/${token}`;

        console.log('\n📧 ===== ENVIANDO CORREO DE RECUPERACIÓN =====');
        console.log('📍 Para:', email);
        console.log('👤 Usuario:', username);
        console.log('🔗 Enlace:', resetLink);
        console.log('🌍 Entorno:', process.env.NODE_ENV || 'development');

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

        console.log('🔄 Enviando correo real...');
        const info = await getTransporter().sendMail(mailOptions);
        
        console.log('✅ CORREO ENVIADO EXITOSAMENTE');
        console.log('   📨 ID del mensaje:', info.messageId);
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
    try {
        console.log('\n📧 ===== ENVIANDO CORREO DE BIENVENIDA =====');
        console.log('📍 Para:', email);
        console.log('👤 Usuario:', username);

        const html = loadTemplate('welcome', {
            username,
            frontendUrl: process.env.FRONTEND_URL || 'https://lucesademexico-shop.com.mx',
            currentYear: new Date().getFullYear()
        });

        const mailOptions = {
            from: `"${process.env.EMAIL_SENDER_NAME || 'Lucesa'}" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '¡Bienvenido a Lucesa!',
            html: html,
            text: `¡Hola ${username}! Tu cuenta ha sido creada exitosamente. Ve a ${process.env.FRONTEND_URL || 'https://lucesademexico-shop.com.mx'} para empezar a personalizar tu perfil.`,
        };

        const info = await getTransporter().sendMail(mailOptions);
        
        console.log('✅ CORREO DE BIENVENIDA ENVIADO');
        console.log('   📨 ID del mensaje:', info.messageId);
        console.log('   👤 Destinatario:', email);
        console.log('==========================================\n');
        
        return { 
            success: true, 
            mode: 'production', 
            messageId: info.messageId 
        };

    } catch (error) {
        console.error('❌ ERROR ENVIANDO CORREO DE BIENVENIDA:', error);
        console.log('==========================================\n');
        
        throw new Error(`No se pudo enviar el correo de bienvenida: ${error.message}`);
    }
};

/**
 * Envía correo de confirmación al comprador
 */
const sendOrderConfirmationToBuyer = async (orderData) => {
    try {
        const {
            buyerEmail,
            buyerName,
            orderNumber,
            products = [],
            totalAmount,
            orderDate,
            paymentMethod = 'Mercado Pago',
            orderLink
        } = orderData;

        console.log('\n📧 ===== ENVIANDO CORREO AL COMPRADOR =====');
        console.log('📍 Para:', buyerEmail);
        console.log('👤 Comprador:', buyerName);
        console.log('🛒 Orden:', orderNumber);
        console.log('💰 Total:', totalAmount);
        console.log('🌍 Entorno:', process.env.NODE_ENV || 'development');

        // Asegurarse de que los productos tengan los campos correctos
        const emailProducts = products.map(p => ({
            name: p.name || p.productName || p.nombre || 'Producto',
            code: p.code || p.productCode || p.codigo || 'N/A',
            quantity: p.quantity || p.cantidad || 1,
            totalPrice: p.totalPrice || p.total_price || (p.precioFinal * (p.quantity || 1)) || 0
        }));

        const html = loadTemplate('order-buyer', {
            buyerName,
            orderNumber,
            products: emailProducts,
            totalAmount: parseFloat(totalAmount).toFixed(2),
            orderDate: orderDate || new Date().toLocaleDateString('es-MX'),
            paymentMethod,
            orderLink: orderLink || `${process.env.FRONTEND_URL || 'https://lucesademexico-shop.com.mx'}/my-account`,
            frontendUrl: process.env.FRONTEND_URL || 'https://lucesademexico-shop.com.mx'
        });

        const mailOptions = {
            from: `"${process.env.EMAIL_SENDER_NAME || 'Lucesa'}" <${process.env.EMAIL_USER}>`,
            to: buyerEmail,
            subject: `✅ Confirmación de Pedido #${orderNumber} - Lucesa`,
            html: html,
            text: `Hola ${buyerName},\n\nTu pedido #${orderNumber} ha sido confirmado exitosamente.\n\nTotal: $${totalAmount} MXN\nFecha: ${orderDate}\n\nPuedes ver el detalle completo de tu pedido en: ${process.env.FRONTEND_URL || 'https://lucesademexico-shop.com.mx'}/my-account\n\nGracias por tu compra,\nEquipo Lucesa`
        };

        console.log('🔄 Enviando correo al comprador...');
        const info = await getTransporter().sendMail(mailOptions);
        
        console.log('✅ CORREO AL COMPRADOR ENVIADO');
        console.log('   📨 ID del mensaje:', info.messageId);
        console.log('==========================================\n');
        
        return { 
            success: true, 
            recipient: 'buyer',
            email: buyerEmail,
            messageId: info.messageId
        };

    } catch (error) {
        console.error('❌ ERROR ENVIANDO CORREO AL COMPRADOR:', error);
        console.log('==========================================\n');
        
        // No lanzar error, solo registrar para no interrumpir el flujo
        return { 
            success: false, 
            recipient: 'buyer',
            error: error.message 
        };
    }
};

/**
 * Envía notificación de orden al vendedor/administrador
 */
const sendOrderNotificationToSeller = async (orderData, sellerEmail, sellerName) => {
    try {
        const {
            buyerEmail,
            buyerName,
            orderNumber,
            products = [],
            totalAmount,
            orderDate,
            shippingAddress
        } = orderData;

        console.log('\n📧 ===== ENVIANDO CORREO AL VENDEDOR =====');
        console.log('📍 Para:', sellerEmail);
        console.log('👤 Vendedor:', sellerName);
        console.log('👥 Cliente:', buyerName);
        console.log('🛒 Orden:', orderNumber);
        console.log('🌍 Entorno:', process.env.NODE_ENV || 'development');

        // Formatear información de envío
        let shippingInfo = 'No especificada';
        if (shippingAddress) {
            if (typeof shippingAddress === 'string') {
                shippingInfo = shippingAddress;
            } else if (typeof shippingAddress === 'object') {
                const parts = [];
                if (shippingAddress.nombre) parts.push(`Nombre: ${shippingAddress.nombre}`);
                if (shippingAddress.direccion) parts.push(`Dirección: ${shippingAddress.direccion}`);
                if (shippingAddress.ciudad) parts.push(`Ciudad: ${shippingAddress.ciudad}`);
                if (shippingAddress.estado) parts.push(`Estado: ${shippingAddress.estado}`);
                if (shippingAddress.cp) parts.push(`CP: ${shippingAddress.cp}`);
                if (shippingAddress.telefono) parts.push(`Teléfono: ${shippingAddress.telefono}`);
                shippingInfo = parts.join(', ');
            }
        }

        // Asegurarse de que los productos tengan los campos correctos
        const emailProducts = products.map(p => ({
            name: p.name || p.productName || p.nombre || 'Producto',
            code: p.code || p.productCode || p.codigo || 'N/A',
            quantity: p.quantity || p.cantidad || 1,
            totalPrice: p.totalPrice || p.total_price || (p.precioFinal * (p.quantity || 1)) || 0
        }));

        const html = loadTemplate('order-seller', {
            sellerName,
            buyerName,
            buyerEmail,
            orderNumber,
            products: emailProducts,
            totalAmount: parseFloat(totalAmount).toFixed(2),
            orderDate: orderDate || new Date().toLocaleDateString('es-MX'),
            shippingInfo,
            adminLink: `${process.env.ADMIN_URL || process.env.FRONTEND_URL || 'https://lucesademexico-shop.com.mx'}/my-account`
        });

        const mailOptions = {
            from: `"${process.env.EMAIL_SENDER_NAME || 'Lucesa'}" <${process.env.EMAIL_USER}>`,
            to: sellerEmail,
            subject: `🛒 Nueva Orden #${orderNumber} - Lucesa`,
            html: html,
            text: `Hola ${sellerName},\n\nHas recibido una nueva orden de ${buyerName} (${buyerEmail}).\n\nNúmero de orden: #${orderNumber}\nTotal: $${totalAmount} MXN\nFecha: ${orderDate}\n\nPor favor procesa esta orden en el sistema de administración.\n\nSaludos,\nSistema de Ventas Lucesa`
        };

        console.log('🔄 Enviando notificación al vendedor...');
        const info = await getTransporter().sendMail(mailOptions);
        
        console.log('✅ CORREO AL VENDEDOR ENVIADO');
        console.log('   📨 ID del mensaje:', info.messageId);
        console.log('==========================================\n');
        
        return { 
            success: true, 
            recipient: 'seller',
            email: sellerEmail,
            messageId: info.messageId
        };

    } catch (error) {
        console.error('❌ ERROR ENVIANDO CORREO AL VENDEDOR:', error);
        console.log('==========================================\n');
        
        return { 
            success: false, 
            recipient: 'seller',
            error: error.message 
        };
    }
};

/**
 * Envía correo de confirmación al comprador para pedido por transferencia
 */
const sendTransferOrderConfirmationToBuyer = async (orderData) => {
  try {
    const {
      buyerEmail,
      buyerName,
      orderNumber,
      products = [],
      totalAmount,
      orderDate,
      transferInfo = {},
      instructions = '',
      shippingAddress
    } = orderData;

    console.log('\n📧 ===== ENVIANDO CORREO DE TRANSFERENCIA AL COMPRADOR =====');
    console.log('📍 Para:', buyerEmail);
    console.log('👤 Comprador:', buyerName);
    console.log('🏦 Orden de transferencia:', orderNumber);
    console.log('💰 Total:', totalAmount);
    console.log('🌍 Entorno:', process.env.NODE_ENV || 'development');

    // Preparar datos de transferencia
    const bankInfo = transferInfo || {
      bank_name: 'BBVA',
      account_number: '00743648380125258480',
      account_holder: 'SERVICIOS DE TECNOLOGIA, INFRAESTRUCTURA Y SOLUCIONES GLOBALES LUCE',
      clabe: '012180001252584809',
      reference: orderNumber,
      email: 'lucesacorreooficial@gmail.com',
      whatsapp: '+5215611926523'
    };

    // Formatear información de envío
    let shippingInfo = 'No especificada';
    if (shippingAddress) {
      if (typeof shippingAddress === 'string') {
        shippingInfo = shippingAddress;
      } else if (typeof shippingAddress === 'object') {
        const parts = [];
        if (shippingAddress.address) parts.push(shippingAddress.address);
        if (shippingAddress.city) parts.push(shippingAddress.city);
        if (shippingAddress.state) parts.push(shippingAddress.state);
        if (shippingAddress.zipCode) parts.push(`CP: ${shippingAddress.zipCode}`);
        if (shippingAddress.country) parts.push(shippingAddress.country);
        shippingInfo = parts.join(', ');
      }
    }

    // Preparar productos
    const emailProducts = products.map(p => ({
      productName: p.productName || p.nombre || p.name || 'Producto',
      productCode: p.productCode || p.codigo || p.code || 'N/A',
      quantity: p.quantity || 1,
      unitPrice: parseFloat(p.unitPrice || p.precioFinal || p.precio || 0).toFixed(2),
      totalPrice: parseFloat(p.totalPrice || p.total_price || (p.unitPrice * (p.quantity || 1)) || 0).toFixed(2)
    }));

    // Cargar plantilla de transferencia
    const html = loadTemplate('order-transfer-buyer', {
      buyerName,
      orderNumber,
      products: emailProducts,
      totalAmount: parseFloat(totalAmount).toFixed(2),
      orderDate: orderDate || new Date().toLocaleDateString('es-MX'),
      bankInfo,
      instructions: instructions || 'Por favor envía tu comprobante de transferencia por WhatsApp o correo electrónico.',
      shippingInfo,
      contactEmail: bankInfo.email || 'lucesacorreooficial@gmail.com',
      contactWhatsApp: bankInfo.whatsapp || '+5215512345678',
      frontendUrl: process.env.FRONTEND_URL || 'https://lucesademexico-shop.com.mx',
      orderLink: `${process.env.FRONTEND_URL || 'https://lucesademexico-shop.com.mx'}/my-account`,
      currentYear: new Date().getFullYear()
    });

    const mailOptions = {
      from: `"${process.env.EMAIL_SENDER_NAME || 'Lucesa'}" <${process.env.EMAIL_USER}>`,
      to: buyerEmail,
      subject: `🏦 Instrucciones de Transferencia - Orden #${orderNumber} - Lucesa`,
      html: html,
      text: `Hola ${buyerName},\n\nTu pedido #${orderNumber} ha sido registrado para pago por transferencia.\n\n**INFORMACIÓN BANCARIA**\nBanco: ${bankInfo.bank_name}\nCuenta: ${bankInfo.account_number}\nTitular: ${bankInfo.account_holder}\nCLABE: ${bankInfo.clabe}\nReferencia: ${bankInfo.reference}\n\n**MONTO:** $${parseFloat(totalAmount).toFixed(2)} MXN\n\n**INSTRUCCIONES:**\n1. Realiza la transferencia por el monto exacto\n2. Usa la referencia en el concepto\n3. Guarda el comprobante\n4. Envíalo por:\n   WhatsApp: ${bankInfo.whatsapp}\n   Email: ${bankInfo.email}\n\n**TIEMPO LÍMITE:** 72 horas\n\n**ESTADO:** Pendiente de pago\n\n**DIRECCIÓN DE ENVÍO:** ${shippingInfo}\n\nPuedes ver el detalle de tu pedido en: ${process.env.FRONTEND_URL || 'https://lucesademexico-shop.com.mx'}/my-account\n\nGracias por tu compra,\nEquipo Lucesa`
    };

    console.log('🔄 Enviando correo de transferencia al comprador...');
    const info = await getTransporter().sendMail(mailOptions);
    
    console.log('✅ CORREO DE TRANSFERENCIA AL COMPRADOR ENVIADO');
    console.log('   📨 ID del mensaje:', info.messageId);
    console.log('   📬 Respuesta:', info.response);
    console.log('==========================================\n');
    
    return { 
      success: true, 
      recipient: 'buyer_transfer',
      email: buyerEmail,
      messageId: info.messageId,
      orderNumber: orderNumber
    };

  } catch (error) {
    console.error('❌ ERROR ENVIANDO CORREO DE TRANSFERENCIA AL COMPRADOR:', error);
    console.log('==========================================\n');
    
    return { 
      success: false, 
      recipient: 'buyer_transfer',
      error: error.message 
    };
  }
};

/**
 * Envía notificación de orden de transferencia al vendedor/administrador
 */
const sendTransferOrderNotificationToSeller = async (orderData, sellerEmail, sellerName) => {
  try {
    const {
      buyerEmail,
      buyerName,
      orderNumber,
      products = [],
      totalAmount,
      orderDate,
      shippingAddress,
      transferInfo = {}
    } = orderData;

    console.log('\n📧 ===== ENVIANDO CORREO DE TRANSFERENCIA AL VENDEDOR =====');
    console.log('📍 Para:', sellerEmail);
    console.log('👤 Vendedor:', sellerName);
    console.log('👥 Cliente:', buyerName);
    console.log('🏦 Orden de transferencia:', orderNumber);
    console.log('🌍 Entorno:', process.env.NODE_ENV || 'development');

    // Formatear información de envío
    let shippingInfo = 'No especificada';
    if (shippingAddress) {
      if (typeof shippingAddress === 'string') {
        shippingInfo = shippingAddress;
      } else if (typeof shippingAddress === 'object') {
        const parts = [];
        if (shippingAddress.address) parts.push(shippingAddress.address);
        if (shippingAddress.city) parts.push(shippingAddress.city);
        if (shippingAddress.state) parts.push(shippingAddress.state);
        if (shippingAddress.zipCode) parts.push(`CP: ${shippingAddress.zipCode}`);
        if (shippingAddress.country) parts.push(shippingAddress.country);
        shippingInfo = parts.join(', ');
      }
    }

    // Preparar productos
    const emailProducts = products.map(p => ({
      productName: p.productName || p.nombre || p.name || 'Producto',
      productCode: p.productCode || p.codigo || p.code || 'N/A',
      quantity: p.quantity || 1,
      unitPrice: parseFloat(p.unitPrice || p.precioFinal || p.precio || 0).toFixed(2),
      totalPrice: parseFloat(p.totalPrice || p.total_price || (p.unitPrice * (p.quantity || 1)) || 0).toFixed(2)
    }));

    // Cargar plantilla
    const html = loadTemplate('order-transfer-seller', {
      sellerName,
      buyerName,
      buyerEmail,
      orderNumber,
      products: emailProducts,
      totalAmount: parseFloat(totalAmount).toFixed(2),
      orderDate: orderDate || new Date().toLocaleDateString('es-MX'),
      shippingInfo,
      paymentMethod: 'Transferencia Bancaria',
      adminLink: `${process.env.ADMIN_URL || process.env.FRONTEND_URL || 'https://lucesademexico-shop.com.mx'}/my-account`,
      importantNote: '⚠️ ESTA ORDEN REQUIERE CONFIRMACIÓN DE PAGO. El cliente debe enviar el comprobante de transferencia.',
      bankInfo: transferInfo,
      currentYear: new Date().getFullYear()
    });

    const mailOptions = {
      from: `"${process.env.EMAIL_SENDER_NAME || 'Lucesa'}" <${process.env.EMAIL_USER}>`,
      to: sellerEmail,
      subject: `🏦 NUEVA ORDEN POR TRANSFERENCIA #${orderNumber} - Lucesa`,
      html: html,
      text: `Hola ${sellerName},\n\nNUEVA ORDEN POR TRANSFERENCIA de ${buyerName} (${buyerEmail}).\n\n⚠️ IMPORTANTE: Requiere confirmación de pago.\n\nNúmero de orden: #${orderNumber}\nTotal: $${totalAmount} MXN\nMétodo: Transferencia Bancaria\nFecha: ${orderDate}\nDirección: ${shippingInfo}\n\nINFORMACIÓN BANCARIA PARA EL CLIENTE:\nBanco: ${transferInfo.bank_name || 'BBVA'}\nCuenta: ${transferInfo.account_number || '00743648380125258480'}\nReferencia: ${transferInfo.reference || orderNumber}\n\nEl cliente debe enviar el comprobante de transferencia. Por favor monitorea esta orden.\n\nSaludos,\nSistema de Ventas Lucesa`
    };

    console.log('🔄 Enviando notificación de transferencia al vendedor...');
    const info = await getTransporter().sendMail(mailOptions);
    
    console.log('✅ CORREO DE TRANSFERENCIA AL VENDEDOR ENVIADO');
    console.log('   📨 ID del mensaje:', info.messageId);
    console.log('   📬 Respuesta:', info.response);
    console.log('==========================================\n');
    
    return { 
      success: true, 
      recipient: 'seller_transfer',
      email: sellerEmail,
      messageId: info.messageId,
      orderNumber: orderNumber
    };

  } catch (error) {
    console.error('❌ ERROR ENVIANDO CORREO DE TRANSFERENCIA AL VENDEDOR:', error);
    console.log('==========================================\n');
    
    return { 
      success: false, 
      recipient: 'seller_transfer',
      error: error.message 
    };
  }
};

/**
 * Envía correos para pedido de transferencia
 */
const sendTransferOrderEmails = async (orderData, sellerInfo = null) => {
  try {
    console.log('\n📧 ===== PROCESANDO ENVÍO DE CORREOS DE TRANSFERENCIA =====');
    console.log('🏦 Orden de transferencia:', orderData.orderNumber);
    console.log('👤 Comprador:', orderData.buyerEmail);
    console.log('💰 Total:', orderData.totalAmount);
    console.log('🌍 Entorno:', process.env.NODE_ENV || 'development');
    
    const results = [];
    
    // 1. Enviar correo al comprador con instrucciones de transferencia
    const buyerResult = await sendTransferOrderConfirmationToBuyer(orderData);
    results.push(buyerResult);
    
    // 2. Enviar correo al vendedor
    if (sellerInfo && sellerInfo.email) {
      const sellerResult = await sendTransferOrderNotificationToSeller(
        orderData, 
        sellerInfo.email, 
        sellerInfo.name || 'Administrador Lucesa'
      );
      results.push(sellerResult);
    } else {
      // Enviar a correo por defecto del administrador
      const defaultSellerResult = await sendTransferOrderNotificationToSeller(
        orderData, 
        process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'lucesacorreooficial@gmail.com', 
        'Administrador Lucesa'
      );
      results.push(defaultSellerResult);
    }
    
    // Resumen de resultados
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`📊 RESUMEN TRANSFERENCIA: ${successCount} exitosos, ${failCount} fallidos`);
    console.log('==========================================\n');
    
    return {
      success: successCount > 0,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failCount,
        orderType: 'transfer',
        orderNumber: orderData.orderNumber
      }
    };
    
  } catch (error) {
    console.error('❌ ERROR EN ENVÍO DE CORREOS DE TRANSFERENCIA:', error);
    console.log('==========================================\n');
    
    return {
      success: false,
      error: error.message,
      results: [],
      summary: {
        total: 0,
        successful: 0,
        failed: 0,
        orderType: 'transfer'
      }
    };
  }
};

/**
 * Envía correos a comprador y vendedor simultáneamente
 */
const sendOrderEmails = async (orderData, sellerInfo = null) => {
    try {
        console.log('\n📧 ===== PROCESANDO ENVÍO DE CORREOS DE ORDEN =====');
        console.log('🛒 Orden:', orderData.orderNumber);
        console.log('👤 Comprador:', orderData.buyerEmail);
        console.log('🌍 Entorno:', process.env.NODE_ENV || 'development');
        
        // Verificar estructura de productos
        console.log('📦 Verificando productos para correos:');
        if (orderData.products && orderData.products.length > 0) {
            const sampleProduct = orderData.products[0];
            console.log('   Primer producto:', {
                name: sampleProduct.name,
                code: sampleProduct.code,
                quantity: sampleProduct.quantity,
                totalPrice: sampleProduct.totalPrice,
                allKeys: Object.keys(sampleProduct)
            });
        } else {
            console.log('⚠️ No hay productos en los datos');
        }
        
        const results = [];
        
        // 1. Enviar correo al comprador
        const buyerResult = await sendOrderConfirmationToBuyer(orderData);
        results.push(buyerResult);
        
        // 2. Enviar correo al vendedor
        if (sellerInfo && sellerInfo.email) {
            const sellerResult = await sendOrderNotificationToSeller(
                orderData, 
                sellerInfo.email, 
                sellerInfo.name || 'Administrador Lucesa'
            );
            results.push(sellerResult);
        } else {
            // Enviar a correo por defecto del administrador
            const defaultSellerResult = await sendOrderNotificationToSeller(
                orderData, 
                process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'lucesacorreooficial@gmail.com', 
                'Administrador Lucesa'
            );
            results.push(defaultSellerResult);
        }
        
        // Resumen de resultados
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;
        
        console.log(`📊 RESUMEN: ${successCount} exitosos, ${failCount} fallidos`);
        console.log('==========================================\n');
        
        return {
            success: successCount > 0, // Considerar éxito si al menos uno fue exitoso
            results,
            summary: {
                total: results.length,
                successful: successCount,
                failed: failCount
            }
        };
        
    } catch (error) {
        console.error('❌ ERROR EN ENVÍO DE CORREOS:', error);
        console.log('==========================================\n');
        
        return {
            success: false,
            error: error.message,
            results: [],
            summary: {
                total: 0,
                successful: 0,
                failed: 0
            }
        };
    }
};

/**
 * Función para enviar correo de prueba
 */
const sendTestEmail = async (toEmail, subject = 'Correo de prueba') => {
    try {
        console.log('\n📧 ===== ENVIANDO CORREO DE PRUEBA =====');
        console.log('📍 Para:', toEmail);
        console.log('📌 Asunto:', subject);

        const testHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 30px; background: #f9fafb; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Correo de Prueba</h1>
            <p>Lucesa - Sistema de Correos</p>
        </div>
        <div class="content">
            <h2>¡Hola!</h2>
            <p>Este es un correo de prueba enviado desde el sistema de Lucesa.</p>
            <p><strong>Hora de envío:</strong> ${new Date().toLocaleString('es-MX')}</p>
            <p><strong>Entorno:</strong> ${process.env.NODE_ENV || 'development'}</p>
            <p><strong>Servidor:</strong> ${process.env.EMAIL_USER || 'No configurado'}</p>
            <p style="margin-top: 30px; padding: 15px; background: #d1fae5; border-radius: 8px; border-left: 4px solid #10b981;">
                <strong>✅ Estado:</strong> Si recibes este correo, el sistema de envío está funcionando correctamente.
            </p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Lucesa. Todos los derechos reservados.</p>
            <p>Este es un mensaje automático de prueba.</p>
        </div>
    </div>
</body>
</html>`;

        const mailOptions = {
            from: `"${process.env.EMAIL_SENDER_NAME || 'Lucesa - Sistema de Pruebas'}" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: subject,
            html: testHtml,
            text: `Este es un correo de prueba enviado desde el sistema de Lucesa.\n\nHora: ${new Date().toLocaleString('es-MX')}\nEntorno: ${process.env.NODE_ENV || 'development'}\nServidor: ${process.env.EMAIL_USER || 'No configurado'}\n\nSi recibes este correo, el sistema está funcionando correctamente.`
        };

        const info = await getTransporter().sendMail(mailOptions);
        
        console.log('✅ CORREO DE PRUEBA ENVIADO');
        console.log('   📨 ID del mensaje:', info.messageId);
        console.log('   📬 Respuesta:', info.response);
        console.log('==========================================\n');
        
        return { 
            success: true, 
            messageId: info.messageId,
            response: info.response
        };

    } catch (error) {
        console.error('❌ ERROR EN CORREO DE PRUEBA:', error);
        console.log('==========================================\n');
        
        throw new Error(`No se pudo enviar el correo de prueba: ${error.message}`);
    }
};

module.exports = {
    sendPasswordResetEmailG,
    sendWelcomeEmailG,
    sendOrderConfirmationToBuyer,
    sendOrderNotificationToSeller,
    sendOrderEmails,
    sendTransferOrderConfirmationToBuyer,
    sendTransferOrderNotificationToSeller,
    sendTransferOrderEmails,
    sendTestEmail,
    verifyTransporter,
    getTransporter,
    loadTemplate
};