// backend/routes/paymentsG.js
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

    // ✅ GENERAR NÚMERO DE ORDEN LUCESA EN EL BACKEND
    const orderNumber = 'LUCESA-' + Date.now();
    console.log('🔢 Generando número de orden LUCESA:', orderNumber);

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
      RETURNING id, order_number
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

    console.log(`📞 Customer phone guardado: ${customerInfo.phone}`);

    const savedOrder = orderResult.rows[0];
    const orderId = savedOrder.id;
    console.log('✅ Orden guardada en BD con ID:', orderId, 'Número:', savedOrder.order_number);

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
      title: item.nombre.substring(0, 255),
      unit_price: parseFloat((item.precioFinal || item.precio).toFixed(2)),
      quantity: parseInt(item.quantity),
      currency_id: "MXN",
      picture_url: `${IMAGE_BASE_URL}/${item.codigo}?size=medium`
    }));

    console.log('📋 Items para Mercado Pago:', preferenceItems);

    const baseFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const preferenceData = {
      body: {
        items: preferenceItems,
        back_urls: {
          success: `${baseFrontendUrl}/pago/exito`,
          failure: `${baseFrontendUrl}/pago/error`,
          pending: `${baseFrontendUrl}/pago/pendiente`
        },
        auto_return: "all",
        external_reference: orderId.toString(),
        notification_url: `${process.env.BACKEND_URL || 'http://localhost:4004'}/api/payments/webhook`,
        payer: {
          name: customerInfo.firstName,
          surname: customerInfo.lastName,
          email: customerInfo.email,
          phone: {
            area_code: "52",
            number: customerInfo.phone.replace(/\D/g, '')
          }
        },
        metadata: {
          order_id: orderId,
          order_number: orderNumber,
          user_id: userId
        }
      }
    };
    
    console.log('📤 Enviando datos a Mercado Pago...');

    try {
      const mpResponse = await Preference.create(preferenceData);

      console.log('✅ Preferencia de Mercado Pago creada:', mpResponse.id);
      console.log('🔗 URL de pago:', mpResponse.init_point);

      // Actualizar orden con datos de Mercado Pago
      await client.query(`
        UPDATE orders SET mp_preference_id = $1, mp_init_point = $2 WHERE id = $3
      `, [mpResponse.id, mpResponse.init_point, orderId]);

      console.log('✅ Datos de Mercado Pago guardados en la orden');

      await client.query('COMMIT');
      console.log('✅ Transacción completada exitosamente');

      // Usar init_point para redirección
      const paymentUrl = mpResponse.init_point;

      // ✅ DEVOLVER TODOS LOS DATOS NECESARIOS AL FRONTEND
      res.json({
        success: true,
        payment_url: paymentUrl,
        order_number: savedOrder.order_number,
        order_id: orderId,
        mp_preference_id: mpResponse.id,
        total: total,
        subtotal: subtotal,
        tax: tax,
        shipping: shipping,
        cartItems: validatedCartItems,
        customerInfo: customerInfo,
        shippingAddress: shippingAddress,
        timestamp: new Date().toISOString()
      });

    } catch (mpError) {
      console.error('❌ Error de Mercado Pago:', mpError);
      
      // Intentar obtener más detalles del error
      if (mpError.cause) {
        console.error('🔍 Causa del error MP:', mpError.cause);
      }
      
      throw new Error(`Error en Mercado Pago: ${mpError.message}`);
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creando pago:', error);

    // Log detallado del error
    console.error('🔍 Detalles del error:');
    console.error('   - Mensaje:', error.message);
    console.error('   - Stack:', error.stack);

    res.status(500).json({
      success: false,
      message: error.message || 'Error del servidor al procesar el pago'
    });
  } finally {
    client.release();
  }
});

/**
 * Ruta para buscar órdenes por payment_id
 */
router.get('/find-order-by-payment/:paymentId', auth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    console.log(`🔍 Buscando orden por payment_id: ${paymentId}`);
    
    const query = `
      SELECT 
        o.*,
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_code', oi.product_code,
            'product_name', oi.product_name,
            'product_brand', oi.product_brand,
            'product_image_url', oi.product_image_url,
            'unit_price', oi.unit_price,
            'quantity', oi.quantity,
            'total_price', oi.total_price,
            'precio', oi.unit_price,
            'precioFinal', oi.unit_price,
            'nombre', oi.product_name,
            'codigo', oi.product_code,
            'marca', oi.product_brand
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.mp_payment_id = $1 OR o.mp_preference_id = $1
      GROUP BY o.id
    `;
    
    const result = await db.query(query, [paymentId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada para este payment_id'
      });
    }
    
    const order = result.rows[0];
    
    // Formatear la respuesta
    const formattedOrder = {
      id: order.id,
      user_id: order.user_id,
      order_number: order.order_number,
      total_amount: parseFloat(order.total_amount) || 0,
      subtotal: parseFloat(order.subtotal) || 0,
      tax_amount: parseFloat(order.tax_amount) || 0,
      shipping_amount: parseFloat(order.shipping_amount) || 0,
      total: parseFloat(order.total_amount) || 0,
      tax: parseFloat(order.tax_amount) || 0,
      shipping: parseFloat(order.shipping_amount) || 0,
      cartItems: order.items || [],
      items: order.items || [],
      mp_payment_id: order.mp_payment_id,
      mp_preference_id: order.mp_preference_id,
      status: order.status,
      created_at: order.created_at,
      shipping_address: order.shipping_address ? 
        (typeof order.shipping_address === 'string' ? 
          JSON.parse(order.shipping_address) : 
          order.shipping_address) : 
        null
    };
    
    console.log(`✅ Orden encontrada: ${formattedOrder.order_number} con ${formattedOrder.items.length} items`);
    
    res.json({
      success: true,
      order: formattedOrder
    });
    
  } catch (error) {
    console.error('❌ Error buscando orden por payment_id:', error);
    res.status(500).json({
      success: false,
      message: 'Error buscando la orden',
      error: error.message
    });
  }
});

/**
 * Ruta para obtener orden por external_reference
 */
router.get('/get-order-by-reference/:reference', auth, async (req, res) => {
  try {
    const { reference } = req.params;
    
    console.log(`🔍 Buscando orden por reference: ${reference}`);
    
    let orderId;
    
    // Si reference es un número, buscar por ID
    if (!isNaN(reference)) {
      orderId = parseInt(reference);
    } else if (reference.startsWith('LUCESA-')) {
      // Si es un número LUCESA, buscar por order_number
      const orderResult = await db.query(
        'SELECT id FROM orders WHERE order_number = $1',
        [reference]
      );
      
      if (orderResult.rows.length > 0) {
        orderId = orderResult.rows[0].id;
      } else {
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Formato de referencia inválido'
      });
    }
    
    // Obtener la orden completa
    const query = `
      SELECT 
        o.*,
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_code', oi.product_code,
            'product_name', oi.product_name,
            'product_brand', oi.product_brand,
            'product_image_url', oi.product_image_url,
            'unit_price', oi.unit_price,
            'quantity', oi.quantity,
            'total_price', oi.total_price
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id
    `;
    
    const result = await db.query(query, [orderId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }
    
    const order = result.rows[0];
    
    res.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        total_amount: parseFloat(order.total_amount) || 0,
        subtotal: parseFloat(order.subtotal) || 0,
        tax_amount: parseFloat(order.tax_amount) || 0,
        shipping_amount: parseFloat(order.shipping_amount) || 0,
        status: order.status,
        mp_payment_id: order.mp_payment_id,
        mp_preference_id: order.mp_preference_id,
        cartItems: order.items || [],
        items: order.items || [],
        created_at: order.created_at
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo orden por reference:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo la orden',
      error: error.message
    });
  }
});

/**
 * WEBHOOK CORREGIDO - CON MANEJO DE TIPOS EXPLÍCITO
 */
router.post('/webhook', async (req, res) => {
  console.log('🔔 WEBHOOK RECIBIDO - VERSIÓN CORREGIDA');
  
  // Responder inmediatamente a Mercado Pago (IMPORTANTE)
  res.status(200).send('OK');
  
  // Procesar en segundo plano para no bloquear la respuesta
  setTimeout(async () => {
    try {
      const { Payment, MerchantOrder } = require('../config/mercadopago');
      
      console.log('📥 Webhook body recibido:', JSON.stringify(req.body, null, 2));
      console.log('📥 Webhook query params:', req.query);
      
      let paymentId = null;
      let orderId = null;
      
      // Estrategia 1: Manejar merchant_order
      if (req.body.topic === 'merchant_order' || req.body.type === 'merchant_order') {
        console.log('📦 Procesando merchant_order webhook');
        
        let merchantOrderId = null;
        
        if (req.body.resource && req.body.resource.includes('merchant_orders')) {
          merchantOrderId = req.body.resource.split('/').pop();
        } else if (req.body.data && req.body.data.id) {
          merchantOrderId = req.body.data.id;
        } else if (req.query.id) {
          merchantOrderId = req.query.id;
        }
        
        if (merchantOrderId) {
          console.log(`📊 Merchant Order ID: ${merchantOrderId}`);
          
          try {
            const mo = await MerchantOrder.get({ id: merchantOrderId });
            console.log(`✅ Merchant Order obtenida:`, {
              id: mo.id,
              external_reference: mo.external_reference,
              payments: mo.payments?.length || 0
            });
            
            if (mo.payments && mo.payments.length > 0) {
              paymentId = mo.payments[0].id.toString();
              console.log(`💰 Payment ID desde merchant_order: ${paymentId}`);
            }
            
            if (mo.external_reference) {
              orderId = parseInt(mo.external_reference);
              console.log(`📦 Order ID desde merchant_order: ${orderId}`);
            }
          } catch (moError) {
            console.error('❌ Error obteniendo merchant_order:', moError.message);
            // Continuamos con otras estrategias
          }
        }
      }
      
      // Estrategia 2: Manejar payment
      if (req.body.topic === 'payment' || req.body.type === 'payment') {
        console.log('💰 Procesando payment webhook');
        
        if (req.body.data && req.body.data.id) {
          paymentId = req.body.data.id;
        } else if (req.body.id) {
          paymentId = req.body.id;
        } else if (req.body.resource && !req.body.resource.includes('merchant_orders')) {
          paymentId = req.body.resource;
        } else if (req.query.id) {
          paymentId = req.query.id;
        }
        
        console.log(`💳 Payment ID detectado: ${paymentId}`);
      }
      
      // Si no tenemos paymentId aún, intentar del resource
      if (!paymentId && req.body.resource && !req.body.resource.includes('merchant_orders')) {
        paymentId = req.body.resource;
        console.log(`🔍 Payment ID desde resource: ${paymentId}`);
      }
      
      if (!paymentId) {
        console.log('❌ No se pudo obtener paymentId del webhook');
        return;
      }
      
      // Obtener detalles del pago de Mercado Pago
      let payment;
      try {
        payment = await Payment.get({ id: paymentId });
        console.log(`✅ Pago obtenido de MP:`, {
          id: payment.id,
          status: payment.status,
          status_detail: payment.status_detail,
          external_reference: payment.external_reference
        });
      } catch (mpError) {
        console.error('❌ Error obteniendo pago de MP:', mpError.message);
        return;
      }
      
      // Obtener orderId del external_reference
      if (payment.external_reference) {
        orderId = parseInt(payment.external_reference);
        console.log(`📦 Order ID desde external_reference: ${orderId}`);
      }
      
      // Si aún no tenemos orderId, buscar en la BD por payment_id
      if (!orderId) {
        console.log('🔍 Buscando orden en BD por payment_id:', paymentId);
        
        const client = await db.connect();
        try {
          // Usar CAST explícito para evitar problemas de tipos
          const result = await client.query(
            `SELECT id, order_number FROM orders 
             WHERE mp_payment_id = CAST($1 AS TEXT) 
                OR mp_preference_id = CAST($1 AS TEXT)`,
            [paymentId.toString()]
          );
          
          if (result.rows.length > 0) {
            orderId = result.rows[0].id;
            console.log(`✅ Order ID encontrado en BD: ${orderId} (${result.rows[0].order_number})`);
          }
        } catch (dbError) {
          console.error('❌ Error buscando orden en BD:', dbError.message);
        } finally {
          client.release();
        }
      }
      
      if (!orderId) {
        console.log('❌ No se pudo determinar el orderId');
        return;
      }
      
      console.log(`🎯 Procesando actualización para Order ID: ${orderId}, Payment ID: ${paymentId}`);
      
      // Procesar estado del pago
      const mpStatus = String(payment.status || 'pending').toLowerCase().trim();
      const mpStatusDetail = payment.status_detail ? String(payment.status_detail) : 'none';
      
      console.log(`📊 Estado del pago: ${mpStatus}, Detalle: ${mpStatusDetail}`);
      
      // Mapeo de estados
      const statusMap = {
        'approved': 'completed',
        'pending': 'pending',
        'in_process': 'processing',
        'rejected': 'cancelled',
        'cancelled': 'cancelled',
        'refunded': 'refunded'
      };
      
      const newStatus = statusMap[mpStatus] || 'pending';
      const mpPaymentStatus = mpStatus;
      
      console.log(`🔄 Actualizando orden a: ${newStatus}`);
      
      // ✅ ACTUALIZACIÓN CON TIPOS EXPLÍCITOS PARA EVITAR ERRORES
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        
        // Verificar si la orden existe
        const orderCheck = await client.query(
          'SELECT id, order_number, status FROM orders WHERE id = $1',
          [orderId]
        );
        
        if (orderCheck.rows.length === 0) {
          console.log(`❌ Orden ${orderId} no encontrada en BD`);
          await client.query('ROLLBACK');
          return;
        }
        
        const currentOrder = orderCheck.rows[0];
        console.log(`📋 Orden actual: ${currentOrder.order_number}, Status: ${currentOrder.status}`);
        
        // ✅ CONSULTA CORREGIDA CON CASTS EXPLÍCITOS
        const updateQuery = `
          UPDATE orders 
          SET 
            status = $1,
            mp_payment_id = $2::text,
            mp_payment_status = $3::text,
            mp_status_detail = $4::text,
            updated_at = NOW(),
            paid_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE paid_at END
          WHERE id = $5
          RETURNING order_number, status, mp_payment_id
        `;
        
        console.log('📝 Ejecutando consulta con casts explícitos...');
        console.log('📋 Parámetros:', {
          status: newStatus,
          paymentId: paymentId.toString(),
          mpStatus: mpPaymentStatus,
          mpStatusDetail: mpStatusDetail,
          orderId: orderId
        });
        
        const result = await client.query(updateQuery, [
          newStatus,
          paymentId.toString(), // Asegurar que sea string
          mpPaymentStatus,
          mpStatusDetail,
          orderId
        ]);
        
        await client.query('COMMIT');
        
        if (result.rowCount > 0) {
          const updatedOrder = result.rows[0];
          console.log(`✅ ORDEN ${updatedOrder.order_number} ACTUALIZADA: ${updatedOrder.status.toUpperCase()}`);
          console.log(`💳 Payment ID guardado: ${updatedOrder.mp_payment_id}`);
          
          if (newStatus === 'completed') {
            console.log(`🎉 PAGO COMPLETADO para orden: ${updatedOrder.order_number}`);
            
            // Obtener detalles de los items
            const itemsResult = await client.query(
              'SELECT product_name, quantity, unit_price, total_price FROM order_items WHERE order_id = $1',
              [orderId]
            );
            
            console.log(`📦 La orden tiene ${itemsResult.rows.length} items:`);
            let totalItems = 0;
            itemsResult.rows.forEach(item => {
              console.log(`   - ${item.product_name}: ${item.quantity} x $${item.unit_price} = $${item.total_price}`);
              totalItems += parseInt(item.quantity);
            });
            
            console.log(`📊 Total de productos: ${totalItems} unidades`);
            
            // Obtener total de la orden
            const totalResult = await client.query(
              'SELECT total_amount FROM orders WHERE id = $1',
              [orderId]
            );
            
            if (totalResult.rows.length > 0) {
              console.log(`💰 Total de la orden: $${totalResult.rows[0].total_amount} MXN`);
            }
          }
        } else {
          console.log('⚠️ No se actualizó ninguna fila');
        }
        
      } catch (dbError) {
        await client.query('ROLLBACK');
        console.error('❌ Error en transacción de BD:', dbError.message);
        console.error('🔍 Detalles del error SQL:', {
          code: dbError.code,
          detail: dbError.detail,
          hint: dbError.hint,
          position: dbError.position
        });
        
        // Intentar con consulta alternativa más simple
        console.log('🔄 Intentando con consulta alternativa...');
        try {
          const altClient = await db.connect();
          
          // Consulta alternativa sin parámetros complejos
          const altQuery = `
            UPDATE orders 
            SET 
              status = $1,
              updated_at = NOW(),
              paid_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE paid_at END
            WHERE id = $2
            RETURNING order_number, status
          `;
          
          const altResult = await altClient.query(altQuery, [newStatus, orderId]);
          
          if (altResult.rowCount > 0) {
            console.log(`✅ Orden actualizada con consulta alternativa: ${altResult.rows[0].order_number}`);
            
            // Actualizar payment_id en una consulta separada
            if (paymentId) {
              await altClient.query(
                'UPDATE orders SET mp_payment_id = $1 WHERE id = $2',
                [paymentId.toString(), orderId]
              );
              console.log(`💳 Payment ID actualizado separadamente`);
            }
          }
          
          altClient.release();
        } catch (altError) {
          console.error('❌ Error con consulta alternativa:', altError.message);
        }
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error('❌ Error crítico en webhook:', error.message);
      console.error('🔍 Stack trace:', error.stack);
    }
  }, 100); // Pequeño delay para no bloquear la respuesta
});

/**
 * Ruta para verificar el estado de un pago
 */
router.get('/check-payment-status/:paymentId', auth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    console.log(`🔍 Verificando estado del pago: ${paymentId}`);
    
    const { Payment } = require('../config/mercadopago');
    
    let payment;
    try {
      payment = await Payment.get({ id: paymentId });
    } catch (mpError) {
      console.error('❌ Error obteniendo pago de MP:', mpError.message);
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado en Mercado Pago'
      });
    }
    
    // Buscar la orden en la base de datos
    const client = await db.connect();
    try {
      const result = await client.query(
        `SELECT o.*, 
                json_agg(
                  json_build_object(
                    'id', oi.id,
                    'product_code', oi.product_code,
                    'product_name', oi.product_name,
                    'product_brand', oi.product_brand,
                    'product_image_url', oi.product_image_url,
                    'unit_price', oi.unit_price,
                    'quantity', oi.quantity,
                    'total_price', oi.total_price
                  )
                ) as items
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         WHERE o.mp_payment_id = $1 OR o.mp_preference_id = $1
         GROUP BY o.id`,
        [paymentId]
      );
      
      let order = null;
      if (result.rows.length > 0) {
        order = result.rows[0];
      }
      
      res.json({
        success: true,
        payment: {
          id: payment.id,
          status: payment.status,
          status_detail: payment.status_detail,
          external_reference: payment.external_reference,
          date_created: payment.date_created,
          date_approved: payment.date_approved
        },
        order: order ? {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          total_amount: order.total_amount,
          items: order.items || []
        } : null
      });
      
    } catch (dbError) {
      console.error('❌ Error en consulta BD:', dbError.message);
      throw dbError;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Error verificando estado del pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando el estado del pago'
    });
  }
});

/**
 * Ruta para obtener URL de pago de una orden existente
 */
router.get('/get-payment-url/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    console.log(`🔗 Obteniendo URL de pago para orden: ${orderId}`);
    
    const result = await db.query(
      'SELECT mp_preference_id, mp_init_point, status FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }
    
    const order = result.rows[0];
    
    if (!order.mp_init_point) {
      return res.status(404).json({
        success: false,
        message: 'No hay URL de pago disponible para esta orden'
      });
    }
    
    res.json({
      success: true,
      payment_url: order.mp_init_point,
      mp_preference_id: order.mp_preference_id,
      status: order.status
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo URL de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo la URL de pago'
    });
  }
});

/**
 * Ruta para probar webhook localmente
 */
router.post('/test-webhook', async (req, res) => {
  console.log('🧪 WEBHOOK DE PRUEBA RECIBIDO');
  
  try {
    const { paymentId, orderId, status } = req.body;
    
    console.log('📊 Datos de prueba:', { paymentId, orderId, status });
    
    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Faltan parámetros requeridos: orderId y status'
      });
    }
    
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      
      // Verificar si la orden existe
      const orderCheck = await client.query(
        'SELECT id, order_number, status FROM orders WHERE id = $1',
        [orderId]
      );
      
      if (orderCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada'
        });
      }
      
      const currentOrder = orderCheck.rows[0];
      console.log(`📋 Orden actual: ${currentOrder.order_number}, Status: ${currentOrder.status}`);
      
      // Actualizar estado
      const updateQuery = `
        UPDATE orders 
        SET 
          status = $1,
          mp_payment_id = $2,
          mp_payment_status = $3,
          updated_at = NOW(),
          paid_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE paid_at END
        WHERE id = $4
        RETURNING order_number, status
      `;
      
      const result = await client.query(updateQuery, [
        status,
        paymentId || null,
        status,
        orderId
      ]);
      
      await client.query('COMMIT');
      
      console.log(`✅ Orden ${result.rows[0].order_number} actualizada a: ${result.rows[0].status}`);
      
      res.json({
        success: true,
        message: 'Webhook de prueba procesado exitosamente',
        order: result.rows[0]
      });
      
    } catch (dbError) {
      await client.query('ROLLBACK');
      console.error('❌ Error en webhook de prueba:', dbError);
      throw dbError;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Error en webhook de prueba:', error);
    res.status(500).json({
      success: false,
      message: 'Error procesando webhook de prueba'
    });
  }
});

/**
 * Ruta para diagnosticar problemas de tipos en PostgreSQL
 */
router.post('/diagnose-types', async (req, res) => {
  try {
    const client = await db.connect();
    
    console.log('🔍 Diagnóstico de tipos de datos en PostgreSQL...');
    
    // 1. Verificar estructura de la tabla orders
    const tableInfo = await client.query(`
      SELECT 
        column_name, 
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'orders'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Estructura de la tabla "orders":');
    tableInfo.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // 2. Probar diferentes tipos de consultas
    const testCases = [
      {
        name: 'Consulta básica',
        query: 'SELECT id, order_number, status FROM orders WHERE id = 53',
        params: []
      },
      {
        name: 'Consulta con parámetro',
        query: 'SELECT id, order_number, status FROM orders WHERE id = $1',
        params: [53]
      },
      {
        name: 'UPDATE simple',
        query: 'UPDATE orders SET status = $1 WHERE id = $2 RETURNING order_number',
        params: ['completed', 53]
      },
      {
        name: 'UPDATE con CAST',
        query: 'UPDATE orders SET status = $1, mp_payment_id = $2::text WHERE id = $3 RETURNING order_number',
        params: ['completed', 'TEST123', 53]
      }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
      try {
        console.log(`🧪 Probando: ${testCase.name}`);
        const result = await client.query(testCase.query, testCase.params);
        results.push({
          test: testCase.name,
          success: true,
          rows: result.rows.length,
          data: result.rows
        });
        console.log(`✅ ${testCase.name}: Éxito (${result.rows.length} filas)`);
      } catch (error) {
        results.push({
          test: testCase.name,
          success: false,
          error: error.message,
          code: error.code,
          detail: error.detail,
          position: error.position
        });
        console.error(`❌ ${testCase.name}: ${error.message}`);
        if (error.detail) console.error(`   Detalle: ${error.detail}`);
      }
    }
    
    client.release();
    
    res.json({
      success: true,
      table_structure: tableInfo.rows,
      test_results: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    res.status(500).json({
      success: false,
      message: 'Error en diagnóstico',
      error: error.message
    });
  }
});

module.exports = router;