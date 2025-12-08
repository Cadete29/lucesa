const emailService = require('../utils/emailServiceG');

const EmailController = {
    /**
     * Envía correos de confirmación de pedido
     */
    sendOrderConfirmation: async (req, res) => {
        try {
            const { orderData, sellerEmail } = req.body;
            
            if (!orderData || !orderData.customerEmail || !orderData.orderNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de pedido incompletos'
                });
            }
            
            const result = await emailService.sendOrderEmails(orderData, sellerEmail);
            
            res.json({
                success: true,
                message: 'Correos enviados exitosamente',
                data: result
            });
            
        } catch (error) {
            console.error('Error en sendOrderConfirmation:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },
    
    /**
     * Envía solo al cliente
     */
    sendToCustomer: async (req, res) => {
        try {
            const { orderData } = req.body;
            
            if (!orderData || !orderData.customerEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos del cliente incompletos'
                });
            }
            
            const result = await emailService.sendOrderConfirmationEmail(orderData);
            
            res.json({
                success: true,
                message: 'Correo enviado al cliente',
                data: result
            });
            
        } catch (error) {
            console.error('Error en sendToCustomer:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },
    
    /**
     * Envía solo al vendedor
     */
    sendToSeller: async (req, res) => {
        try {
            const { orderData, sellerEmail } = req.body;
            
            if (!sellerEmail || !orderData || !orderData.orderNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos incompletos'
                });
            }
            
            const result = await emailService.sendOrderNotificationToSeller(orderData, sellerEmail);
            
            res.json({
                success: true,
                message: 'Notificación enviada al vendedor',
                data: result
            });
            
        } catch (error) {
            console.error('Error en sendToSeller:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },
    
    /**
     * Prueba el servicio de correo
     */
    testEmailService: async (req, res) => {
        try {
            const { email } = req.body;
            
            const testOrderData = {
                orderNumber: 'TEST-12345',
                customerName: 'Cliente de Prueba',
                customerEmail: email,
                createdAt: new Date(),
                products: [
                    { name: 'Producto de prueba 1', quantity: 2, price: 25.99, total: 51.98, sku: 'TEST001' },
                    { name: 'Producto de prueba 2', quantity: 1, price: 45.50, total: 45.50, sku: 'TEST002' }
                ],
                subtotal: 97.48,
                shippingCost: 10.00,
                discount: 5.00,
                total: 102.48,
                shippingAddress: {
                    name: 'Cliente de Prueba',
                    address: 'Calle Falsa 123',
                    city: 'Ciudad de Prueba',
                    state: 'Estado de Prueba',
                    zipCode: '12345',
                    phone: '+1 234 567 8900'
                }
            };
            
            const result = await emailService.sendOrderEmails(testOrderData, email);
            
            res.json({
                success: true,
                message: 'Correo de prueba enviado',
                data: result
            });
            
        } catch (error) {
            console.error('Error en testEmailService:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = EmailController;