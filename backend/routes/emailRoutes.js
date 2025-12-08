// backend/routes/emailRoutes.js
const express = require('express');
const router = express.Router();
const { verifyTransporter } = require('../utils/emailServiceG');

// Ruta para verificar estado del servicio de correo
router.get('/status', async (req, res) => {
    try {
        const isVerified = await verifyTransporter();
        
        res.json({
            success: true,
            service: 'Email Service',
            status: isVerified ? 'Operacional' : 'No disponible',
            environment: process.env.NODE_ENV,
            email: process.env.EMAIL_USER ? 'Configurado' : 'No configurado'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Ruta de prueba para enviar correo
router.post('/test', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email es requerido'
            });
        }
        
        const testData = {
            buyerEmail: email,
            buyerName: 'Usuario de Prueba',
            orderNumber: 'TEST-' + Date.now(),
            products: [
                { name: 'Producto de Prueba 1', quantity: 2, totalPrice: '500.00' },
                { name: 'Producto de Prueba 2', quantity: 1, totalPrice: '250.00' }
            ],
            totalAmount: '750.00',
            orderDate: new Date().toLocaleDateString('es-MX'),
            paymentMethod: 'Mercado Pago'
        };
        
        const { sendOrderConfirmationToBuyer } = require('../utils/emailServiceG');
        const result = await sendOrderConfirmationToBuyer(testData);
        
        res.json({
            success: true,
            message: 'Correo de prueba enviado',
            result: result
        });
        
    } catch (error) {
        console.error('Error en prueba de correo:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;