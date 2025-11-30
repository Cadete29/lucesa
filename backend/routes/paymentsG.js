// backend/routes/payments.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middlewares/authenticateTokenG');
const { Preference } = require('../config/mercadopago');

/**
 * Ruta para crear checkout de Mercado Pago
 */
router.post('/create-checkout', auth, async (req, res) => {
  const client = await db.connect();

  console.log('🛒 Iniciando creación de checkout...');
  console.log('👤 Usuario autenticado:', req.user.id, req.user.email);

  try {
    await client.query('BEGIN');

    const { cartItems, shippingAddress, customerInfo } = req.body;
    const userId = req.user.id;

    // Validaciones básicas
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El carrito está vacío'
      });
    }

    if (!shippingAddress || !customerInfo) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos de envío o información del cliente'
      });
    }

    // ✅ CORRECCIÓN: Manejar productos sin nombre de forma más flexible
    const validatedCartItems = cartItems.map(item => {
      // Si no hay nombre, usar una descripción alternativa
      let productName = item.nombre;
      
      if (!productName || productName.trim() === '') {
        if (item.descripcion && item.descripcion.trim() !== '') {
          // Usar la descripción si está disponible
          productName = item.descripcion.substring(0, 100) + '...';
        } else if (item.codigo) {
          // Usar el código del producto
          productName = `Producto ${item.codigo}`;
        } else {
          // Nombre genérico
          productName = 'Producto Lucesa';
        }
        console.log(`⚠️ Producto sin nombre - Usando: ${productName}`);
      }
      
      return {
        ...item,
        nombre: productName
      };
    });

    console.log('✅ Productos validados:', validatedCartItems.map(item => item.nombre));

    // Cálculos
    const subtotal = validatedCartItems.reduce((sum, item) => sum + (item.precioFinal || item.precio) * item.quantity, 0);
    const tax = subtotal * 0.16;
    const shipping = subtotal >= 1000 ? 0 : 150;
    const total = subtotal + tax + shipping;

    const orderNumber = 'LUCESA-' + Date.now();

    console.log('💰 Cálculos realizados:');
    console.log('   Subtotal:', subtotal);
    console.log('   IVA:', tax);
    console.log('   Envío:', shipping);
    console.log('   Total:', total);
    console.log('   Número de orden:', orderNumber);

    // Guardar orden en la base de datos
    const orderResult = await client.query(`
      INSERT INTO orders (
        user_id, order_number, total_amount, subtotal, tax_amount, 
        shipping_amount, shipping_address, status, 
        customer_name, customer_email, customer_phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, $10)
      RETURNING id
    `, [
      userId, 
      orderNumber, 
      total, 
      subtotal, 
      tax, 
      shipping,
      JSON.stringify(shippingAddress),
      `${customerInfo.firstName} ${customerInfo.lastName}`,
      customerInfo.email, 
      customerInfo.phone
    ]);

    const orderId = orderResult.rows[0].id;
    console.log('✅ Orden guardada en BD con ID:', orderId);

    // Guardar ítems de la orden
    const IMAGE_BASE_URL = process.env.NODE_ENV === 'production'
      ? 'https://testpaginaweb.shop/api/images/code'
      : 'http://localhost:4004/api/images/code';

    console.log('📦 Guardando items de la orden...');
    
    for (const item of validatedCartItems) {
      const imageUrl = `${IMAGE_BASE_URL}/${item.codigo}?size=small`;
      const unitPrice = Number(item.precioFinal || item.precio);

      console.log('   Item:', item.nombre, '- Precio:', unitPrice, '- Cantidad:', item.quantity);

      await client.query(`
        INSERT INTO order_items (
          order_id, product_code, product_name, product_brand, 
          product_image_url, unit_price, quantity, total_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        orderId, 
        item.codigo, 
        item.nombre, 
        item.marca || 'Sin marca',
        imageUrl, 
        unitPrice, 
        item.quantity, 
        unitPrice * item.quantity
      ]);
    }

    // CREAR PREFERENCIA EN MERCADO PAGO
    console.log('💳 Creando preferencia en Mercado Pago...');
    
    const preferenceItems = validatedCartItems.map(item => ({
      title: item.nombre.substring(0, 255), // Mercado Pago limita a 255 caracteres
      unit_price: parseFloat((item.precioFinal || item.precio).toFixed(2)),
      quantity: parseInt(item.quantity),
      currency_id: "MXN",
      picture_url: `${IMAGE_BASE_URL}/${item.codigo}?size=medium`
    }));

    console.log('📋 Items para Mercado Pago:', preferenceItems);

    // ✅ CORRECCIÓN: URLs de retorno ABSOLUTAS y VÁLIDAS
    const baseFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // Asegurar que las URLs sean absolutas y válidas
    const backUrls = {
      success: `${baseFrontendUrl}/pago/exito`,
      failure: `${baseFrontendUrl}/pago/error`, 
      pending: `${baseFrontendUrl}/pago/pendiente`
    };

    console.log('🔗 URLs de retorno configuradas:');
    console.log('   Success:', backUrls.success);
    console.log('   Failure:', backUrls.failure);
    console.log('   Pending:', backUrls.pending);

    // ✅ CORRECCIÓN: Remover auto_return temporalmente para evitar errores
    const preferenceData = {
      body: {
        items: preferenceItems,
        back_urls: backUrls,
        // ❌ REMOVER auto_return temporalmente para debugging
        // auto_return: "approved",
        external_reference: orderId.toString(),
        notification_url: `${process.env.BACKEND_URL || 'http://localhost:4004'}/api/payments/webhook`,
        payer: {
          name: customerInfo.firstName,
          surname: customerInfo.lastName,
          email: customerInfo.email,
          phone: {
            number: customerInfo.phone.replace(/\D/g, ''), // Solo números
            area_code: "52"
          }
        },
        // payment_methods: {
        //   excluded_payment_methods: [],
        //   excluded_payment_types: [],
        //   installments: 1
        // },
        metadata: {
          order_id: orderId,
          order_number: orderNumber,
          user_id: userId
        }
      }
    };

    console.log('📤 Enviando datos a Mercado Pago...');
    console.log('📋 Datos de preferencia:', JSON.stringify(preferenceData, null, 2));

    try {
      const mpResponse = await Preference.create(preferenceData);

      console.log('✅ Preferencia de Mercado Pago creada:', mpResponse.id);
      console.log('🔗 URL de pago:', mpResponse.init_point);
      console.log('🔗 Sandbox URL:', mpResponse.init_point);

      // Actualizar orden con datos de Mercado Pago
      await client.query(`
        UPDATE orders SET mp_preference_id = $1, mp_init_point = $2 WHERE id = $3
      `, [mpResponse.id, mpResponse.init_point, orderId]);

      console.log('✅ Datos de Mercado Pago guardados en la orden');

      await client.query('COMMIT');
      console.log('✅ Transacción completada exitosamente');

      // Usar sandbox_init_point si estamos en desarrollo
      const paymentUrl = process.env.NODE_ENV === 'production' 
        ? mpResponse.init_point 
        : (mpResponse.init_point || mpResponse.init_point);

      res.json({
        success: true,
        payment_url: paymentUrl,
        order_number: orderNumber,
        order_id: orderId,
        mp_preference_id: mpResponse.id
      });

    } catch (mpError) {
      console.error('❌ Error de Mercado Pago:', mpError);
      throw new Error(`Error en Mercado Pago: ${mpError.message}`);
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creando pago:', error);
    
    // Log detallado del error
    console.error('🔍 Detalles del error:');
    console.error('   - Mensaje:', error.message);
    console.error('   - Stack:', error.stack);
    
    // Manejar errores específicos de Mercado Pago
    if (error.message && error.message.includes('Mercado Pago')) {
      return res.status(500).json({ 
        success: false, 
        message: error.message
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error del servidor al procesar el pago' 
    });
  } finally {
    client.release();
  }
});

module.exports = router;