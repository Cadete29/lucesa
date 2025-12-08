// backend/routes/ordersG.js - COMPLETO CORREGIDO
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middlewares/authenticateTokenG.js');
const { 
  sendOrderEmails, 
  sendOrderConfirmationToBuyer, 
  sendOrderNotificationToSeller,
  verifyTransporter 
} = require('../utils/emailServiceG');

// Helper para parsear shipping_address
const parseShippingAddress = (shippingAddress) => {
  if (!shippingAddress) return null;
  
  try {
    if (typeof shippingAddress === 'string') {
      return JSON.parse(shippingAddress);
    }
    return shippingAddress;
  } catch (error) {
    console.error('Error parseando shipping_address:', error);
    return { error: 'Error parsing address' };
  }
};

// Helper para formatear respuesta de orden
const formatOrderResponse = (order) => {
  const shippingAddress = parseShippingAddress(order.shipping_address);
  
  const formattedOrder = {
    id: order.id,
    user_id: order.user_id,
    order_number: order.order_number,
    total_amount: parseFloat(order.total_amount) || 0,
    subtotal: parseFloat(order.subtotal) || 0,
    tax_amount: parseFloat(order.tax_amount) || 0,
    shipping_amount: parseFloat(order.shipping_amount) || 0,
    shipping_address: shippingAddress,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    customer_phone: order.customer_phone,
    mp_payment_id: order.mp_payment_id,
    mp_preference_id: order.mp_preference_id,
    mp_payment_status: order.mp_payment_status,
    mp_status_detail: order.mp_status_detail,
    status: order.status,
    paid_at: order.paid_at,
    created_at: order.created_at,
    updated_at: order.updated_at,
    items: Array.isArray(order.items) ? order.items.map(item => ({
      id: item.id,
      product_code: item.product_code,
      product_name: item.product_name,
      nombre: item.product_name,
      codigo: item.product_code,
      product_brand: item.product_brand,
      marca: item.product_brand,
      product_image_url: item.product_image_url,
      unit_price: parseFloat(item.unit_price) || 0,
      precio: parseFloat(item.unit_price) || 0,
      precioFinal: parseFloat(item.unit_price) || 0,
      quantity: item.quantity || 1,
      total_price: parseFloat(item.total_price) || 0
    })) : []
  };

  // Añadir alias para compatibilidad con frontend
  formattedOrder.total = formattedOrder.total_amount;
  formattedOrder.order_date = formattedOrder.created_at;
  formattedOrder.items_details = formattedOrder.items;

  return formattedOrder;
};

// ==================== FUNCIONES AUXILIARES CORREGIDAS ====================

// Función para formatear productos para correos - CORREGIDA
const formatProductsForEmail = (products) => {
  console.log('📦 Formateando productos para correo...');
  
  if (!Array.isArray(products) || products.length === 0) {
    console.log('⚠️ No hay productos para formatear');
    return [];
  }
  
  const formatted = products.map((p, index) => {
    // **IMPORTANTE: Usar los nombres exactos que la plantilla espera**
    // La plantilla usa: {{this.name}}, {{this.code}}, {{this.quantity}}, {{this.totalPrice}}
    
    // Extraer nombre con múltiples alias
    const name = p.product_name || p.nombre || p.name || `Producto ${index + 1}`;
    const code = p.product_code || p.codigo || p.code || 'N/A';
    const quantity = p.quantity || p.cantidad || 1;
    
    // Calcular precio total
    let unitPrice = 0;
    if (p.unit_price !== undefined && p.unit_price !== null) {
      unitPrice = parseFloat(p.unit_price);
    } else if (p.precio !== undefined && p.precio !== null) {
      unitPrice = parseFloat(p.precio);
    } else if (p.precioFinal !== undefined && p.precioFinal !== null) {
      unitPrice = parseFloat(p.precioFinal);
    } else if (p.price !== undefined && p.price !== null) {
      unitPrice = parseFloat(p.price);
    }
    
    // Obtener totalPrice directamente si existe
    let totalPrice = 0;
    if (p.total_price !== undefined && p.total_price !== null) {
      totalPrice = parseFloat(p.total_price);
    } else if (p.totalPrice !== undefined && p.totalPrice !== null) {
      totalPrice = parseFloat(p.totalPrice);
    } else {
      // Calcular si no existe
      totalPrice = unitPrice * quantity;
    }
    
    console.log(`   Producto ${index + 1}: ${name}`);
    console.log(`      - Código: ${code}`);
    console.log(`      - Cantidad: ${quantity}`);
    console.log(`      - Precio unitario: $${unitPrice.toFixed(2)}`);
    console.log(`      - Total: $${totalPrice.toFixed(2)}`);
    
    // **CRÍTICO: Retornar con los nombres exactos que la plantilla Handlebars espera**
    return {
      name: name,                          // {{this.name}} en plantilla
      code: code,                          // {{this.code}} en plantilla
      quantity: quantity,                  // {{this.quantity}} en plantilla
      totalPrice: totalPrice.toFixed(2),   // {{this.totalPrice}} en plantilla
      
      // Campos adicionales por compatibilidad
      productName: name,
      productCode: code,
      unitPrice: unitPrice,
      total_price: totalPrice,
      
      // Datos originales
      original: p
    };
  });
  
  console.log(`✅ ${formatted.length} productos formateados`);
  console.log('   Estructura del primer producto:', {
    name: formatted[0]?.name,
    code: formatted[0]?.code,
    quantity: formatted[0]?.quantity,
    totalPrice: formatted[0]?.totalPrice
  });
  
  return formatted;
};

// ==================== ENDPOINTS DE CORREOS CORREGIDOS ====================

// Ruta para enviar correos de confirmación - CORREGIDA
router.post('/send-confirmation-emails', auth, async (req, res) => {
  try {
    console.log('='.repeat(60));
    console.log('🔍📧 ENDPOINT: /send-confirmation-emails - Iniciando...');
    console.log('='.repeat(60));
    console.log('👤 Usuario autenticado:', req.user.email);
    console.log('📋 Body recibido:', JSON.stringify(req.body, null, 2));
    
    const {
      orderId,
      buyerEmail,
      buyerName,
      orderNumber,
      products = [],
      totalAmount,
      orderDate,
      paymentMethod = 'Mercado Pago',
      shippingAddress
    } = req.body;

    // DEBUG detallado
    console.log('📦 DEBUG - Análisis de productos recibidos:');
    console.log('   - Cantidad de productos:', products.length);
    
    if (products.length > 0) {
      console.log('   - Primer producto recibido:', JSON.stringify(products[0], null, 2));
      console.log('   - Campos disponibles:', Object.keys(products[0]));
      
      // Mostrar todos los campos y valores del primer producto
      const firstProduct = products[0];
      Object.keys(firstProduct).forEach(key => {
        console.log(`        ${key}:`, firstProduct[key]);
      });
    }

    // Formatear productos para correos (¡CRÍTICO!)
    const formattedProducts = formatProductsForEmail(products);

    // Verificar que el formateo fue correcto
    console.log('✅ Productos formateados para correo:');
    if (formattedProducts.length > 0) {
      console.log('   - Primer producto formateado:', JSON.stringify(formattedProducts[0], null, 2));
      console.log('   - Verificación de campos críticos:');
      console.log('      name:', formattedProducts[0].name);
      console.log('      code:', formattedProducts[0].code);
      console.log('      quantity:', formattedProducts[0].quantity);
      console.log('      totalPrice:', formattedProducts[0].totalPrice);
    }

    // Preparar datos para el correo
    const emailData = {
      orderId,
      buyerEmail,
      buyerName,
      orderNumber,
      products: formattedProducts, // ¡Usar productos formateados!
      totalAmount,
      orderDate: orderDate || new Date().toLocaleDateString('es-MX'),
      paymentMethod,
      shippingAddress: shippingAddress || null,
      orderLink: `${process.env.FRONTEND_URL || 'https://testpaginaweb.shop'}/user-profile?tab=orders`
    };

    // Verificar servicio de correo
    try {
      console.log('🔌 Verificando conexión SMTP...');
      await verifyTransporter();
      console.log('✅ Servicio de correo verificado');
    } catch (emailError) {
      console.warn('⚠️ Advertencia de servicio de correo:', emailError.message);
    }

    // Enviar correos
    console.log('🚀 Enviando correos...');
    const emailResult = await sendOrderEmails(emailData);
    
    console.log('✅ Resultado de envío de correos:');
    console.log('   Resumen:', emailResult.summary);
    if (emailResult.results) {
      emailResult.results.forEach((result, idx) => {
        console.log(`   ${idx + 1}. ${result.recipient}: ${result.success ? '✅' : '❌'}`);
        if (result.error) console.log(`      Error: ${result.error}`);
      });
    }

    console.log('='.repeat(60));
    console.log('📧 CORREOS PROCESADOS');
    console.log('='.repeat(60));

    res.json({
      success: true,
      message: 'Correos de confirmación procesados',
      emailsResults: emailResult.results || [],
      summary: emailResult.summary || { total: 0, successful: 0, failed: 0 },
      debug: {
        products_received: products.length,
        products_sent: formattedProducts.length,
        sample_product_received: products.length > 0 ? products[0] : null,
        sample_product_sent: formattedProducts.length > 0 ? formattedProducts[0] : null
      }
    });

  } catch (error) {
    console.error('❌ Error en /send-confirmation-emails:', error);
    console.error('📝 Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Error al procesar correos',
      error: error.message,
      details: 'Ver logs del servidor'
    });
  }
});

// Ruta para verificar estado del servicio de correos
router.get('/email-service/status', async (req, res) => {
  try {
    console.log('🔍 Verificando estado del servicio de correos...');
    const isVerified = await verifyTransporter();
    
    res.json({
      success: true,
      service: 'Email Service',
      status: isVerified ? 'Operacional' : 'No disponible',
      environment: process.env.NODE_ENV,
      email: process.env.EMAIL_USER ? 'Configurado' : 'No configurado',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error verificando servicio de correos:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      status: 'No disponible'
    });
  }
});

// Endpoint de diagnóstico para verificar datos de productos
router.post('/debug-email-data', auth, async (req, res) => {
  try {
    console.log('🔍 DEBUG: Verificando datos de correo');
    console.log('📋 Body completo recibido:', JSON.stringify(req.body, null, 2));
    
    const { products = [] } = req.body;
    
    console.log('📦 ANÁLISIS DE PRODUCTOS:');
    console.log('   - Cantidad total:', products.length);
    
    if (products.length > 0) {
      console.log('   - Estructura del primer producto:');
      const firstProduct = products[0];
      
      console.log('      Campos disponibles:', Object.keys(firstProduct));
      console.log('      Valores completos:');
      Object.keys(firstProduct).forEach(key => {
        console.log(`        ${key}:`, firstProduct[key]);
      });
      
      // Probar formateo
      console.log('   - Prueba de formateo:');
      const formatted = formatProductsForEmail([firstProduct]);
      console.log('      Producto formateado:', JSON.stringify(formatted[0], null, 2));
    }
    
    // Probar renderizado de plantilla
    console.log('🎨 Probando renderizado de plantilla:');
    const { loadTemplate } = require('../utils/emailServiceG');
    
    const testData = {
      sellerName: 'Administrador',
      buyerName: 'pruebapago',
      buyerEmail: 'test@example.com',
      orderNumber: 'TEST-' + Date.now(),
      orderDate: '7/12/2025',
      totalAmount: '15598.09',
      shippingInfo: 'Dirección de prueba',
      products: formatProductsForEmail(products.length > 0 ? [products[0]] : [])
    };
    
    const html = loadTemplate('order-seller', testData);
    console.log('   ✅ Plantilla renderizada exitosamente');
    
    res.json({
      success: true,
      message: 'Datos analizados exitosamente',
      analysis: {
        products_count: products.length,
        product_fields: products.length > 0 ? Object.keys(products[0]) : [],
        sample_product_received: products.length > 0 ? products[0] : null,
        sample_product_formatted: products.length > 0 ? formatProductsForEmail([products[0]])[0] : null,
        template_test: {
          rendered: html.length > 0,
          products_in_template: testData.products.length,
          sample_product_in_template: testData.products.length > 0 ? testData.products[0] : null
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Ruta de prueba para correo de comprador
router.post('/test-buyer-email', auth, async (req, res) => {
  try {
    console.log('🧪 TEST: test-buyer-email');
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
        { 
          name: 'Producto de Prueba 1', 
          code: 'TEST001',
          quantity: 2, 
          totalPrice: '500.00'
        },
        { 
          name: 'Producto de Prueba 2', 
          code: 'TEST002',
          quantity: 1, 
          totalPrice: '250.00'
        }
      ],
      totalAmount: 750,
      orderDate: new Date().toLocaleDateString('es-MX'),
      paymentMethod: 'Mercado Pago'
    };
    
    console.log('📧 Enviando correo de prueba a:', email);
    console.log('📦 Productos de prueba:', JSON.stringify(testData.products, null, 2));
    
    const result = await sendOrderConfirmationToBuyer(testData);
    
    console.log('✅ Correo de prueba enviado');
    
    res.json({
      success: true,
      message: 'Correo de prueba enviado al comprador',
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

// Ruta de prueba para correo de vendedor
router.post('/test-seller-email', auth, async (req, res) => {
  try {
    console.log('🧪 TEST: test-seller-email');
    const { sellerEmail } = req.body;
    
    if (!sellerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email del vendedor es requerido'
      });
    }
    
    const testData = {
      buyerEmail: 'comprador@test.com',
      buyerName: 'Comprador Test',
      orderNumber: 'TEST-' + Date.now(),
      products: [
        { 
          name: 'Producto Vendido 1', 
          code: 'VEND001',
          quantity: 3, 
          totalPrice: '300.00'
        },
        { 
          name: 'Producto Vendido 2', 
          code: 'VEND002',
          quantity: 1, 
          totalPrice: '150.00'
        }
      ],
      totalAmount: 450,
      orderDate: new Date().toLocaleDateString('es-MX'),
      paymentMethod: 'Mercado Pago',
      shippingAddress: {
        nombre: 'Comprador Test',
        direccion: 'Av. Ventas 456',
        ciudad: 'Guadalajara',
        estado: 'Jalisco',
        cp: '44100',
        telefono: '333-987-6543'
      }
    };
    
    console.log('📧 Enviando correo de prueba a vendedor:', sellerEmail);
    console.log('📦 Productos de prueba:', JSON.stringify(testData.products, null, 2));
    
    const result = await sendOrderNotificationToSeller(testData, sellerEmail, 'Vendedor Test');
    
    console.log('✅ Correo de prueba enviado al vendedor');
    
    res.json({
      success: true,
      message: 'Correo de prueba enviado al vendedor',
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

// ==================== ENDPOINTS DE ÓRDENES ====================

// Guardar nueva orden - CON ENVÍO INMEDIATO DE CORREOS
router.post('/', auth, async (req, res) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      total,
      subtotal,
      tax,
      shipping,
      cartItems,
      shippingAddress
    } = req.body;

    const userId = req.user.id;

    // Generar número de orden LUCESA en el backend
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    const orderNumber = `LUCESA-${timestamp}-${randomNum}`;
    
    console.log('='.repeat(60));
    console.log('🛒 NUEVA ORDEN - INICIANDO PROCESO');
    console.log('='.repeat(60));
    console.log('🔢 Generando orden:', orderNumber);
    console.log('👤 Usuario:', req.user.email, '(ID:', userId, ')');
    console.log('📦 Items en carrito:', cartItems?.length || 0);
    console.log('💰 Total:', total);

    // Parsear shipping address
    let parsedShippingAddress = null;
    if (shippingAddress) {
      try {
        parsedShippingAddress = typeof shippingAddress === 'string' 
          ? JSON.parse(shippingAddress)
          : shippingAddress;
      } catch (error) {
        console.warn('⚠️ Error parseando shippingAddress:', error.message);
        parsedShippingAddress = shippingAddress;
      }
    }

    // 1. Insertar la orden principal
    const orderQuery = `
      INSERT INTO orders (
        user_id, 
        order_number, 
        total_amount, 
        subtotal, 
        tax_amount, 
        shipping_amount,
        shipping_address,
        status,
        customer_name,
        customer_email,
        customer_phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed', $8, $9, $10)
      RETURNING *
    `;

    // Extraer información del usuario para customer fields
    const customerName = req.user.nombre || req.user.username || 'Cliente';
    const customerEmail = req.user.email;
    const customerPhone = parsedShippingAddress?.telefono || '';

    const orderValues = [
      userId,
      orderNumber,
      total,
      subtotal,
      tax,
      shipping,
      parsedShippingAddress ? JSON.stringify(parsedShippingAddress) : null,
      customerName,
      customerEmail,
      customerPhone
    ];

    console.log('💾 Insertando orden en base de datos...');
    const orderResult = await client.query(orderQuery, orderValues);
    const savedOrder = orderResult.rows[0];
    
    console.log('✅ Orden LUCESA creada:', savedOrder.order_number);
    console.log('   ID:', savedOrder.id);
    console.log('   Email cliente:', customerEmail);
    console.log('   Nombre cliente:', customerName);

    // 2. Insertar items de la orden
    if (cartItems && cartItems.length > 0) {
      const IMAGE_BASE_URL = process.env.NODE_ENV === 'production' 
        ? 'https://testpaginaweb.shop/api/images/code'
        : 'http://localhost:4004/api/images/code';

      console.log(`📦 Insertando ${cartItems.length} items para orden ${savedOrder.order_number}...`);

      for (const item of cartItems) {
        // Construir URL de imagen
        const imageUrl = item.codigo ? `${IMAGE_BASE_URL}/${item.codigo}?size=small` : null;
        const quantity = item.quantity || 1;
        const unitPrice = item.precioFinal || item.precio || 0;
        const totalPrice = unitPrice * quantity;

        // Manejar nombres de productos que puedan estar vacíos
        const productName = item.nombre?.trim() || `Producto ${item.codigo || 'Lucesa'}`;

        const itemQuery = `
          INSERT INTO order_items (
            order_id,
            product_code,
            product_name,
            product_brand,
            product_image_url,
            unit_price,
            quantity,
            total_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;

        const itemValues = [
          savedOrder.id,
          item.codigo || 'N/A',
          productName,
          item.marca || 'Sin marca',
          imageUrl,
          unitPrice,
          quantity,
          totalPrice
        ];

        await client.query(itemQuery, itemValues);
      }
      
      console.log(`✅ ${cartItems.length} items insertados`);
    }

    await client.query('COMMIT');
    console.log('💾 Transacción de base de datos completada');

    // 3. Obtener la orden completa con sus items
    const completeOrderQuery = `
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

    const completeOrderResult = await client.query(completeOrderQuery, [savedOrder.id]);
    const completeOrder = formatOrderResponse(completeOrderResult.rows[0]);

    console.log('📊 Orden completa obtenida para respuesta');

    // 🔴🔴🔴 ENVÍO INMEDIATO DE CORREOS - SIN setTimeout 🔴🔴🔴
    console.log('='.repeat(60));
    console.log('📧 INICIANDO ENVÍO DE CORREOS DE CONFIRMACIÓN');
    console.log('='.repeat(60));
    
    try {
      // Formatear productos para el correo
      const productsForEmail = formatProductsForEmail(completeOrder.items || []);
      
      const emailData = {
        orderId: completeOrder.id,
        buyerEmail: customerEmail,
        buyerName: customerName,
        orderNumber: completeOrder.order_number,
        products: productsForEmail,
        totalAmount: completeOrder.total_amount,
        orderDate: new Date(completeOrder.created_at).toLocaleDateString('es-MX'),
        paymentMethod: 'Mercado Pago',
        shippingAddress: completeOrder.shipping_address
      };

      console.log('📨 Datos preparados para correo:');
      console.log('   📧 Para:', emailData.buyerEmail);
      console.log('   🏷️ Orden:', emailData.orderNumber);
      console.log('   📦 Productos:', emailData.products.length);
      console.log('   💰 Total:', emailData.totalAmount);
      
      if (emailData.products.length > 0) {
        console.log('   📋 Muestra de producto formateado:', JSON.stringify(emailData.products[0], null, 2));
      }

      // Enviar correos INMEDIATAMENTE
      console.log('🚀 Enviando correos...');
      const emailResult = await sendOrderEmails(emailData);
      
      console.log('✅ CORREOS ENVIADOS EXITOSAMENTE');
      console.log('📊 Resumen:', emailResult.summary);
      
      if (emailResult.results) {
        emailResult.results.forEach((result, idx) => {
          console.log(`   ${idx + 1}. ${result.recipient}: ${result.success ? '✅' : '❌'}`);
          if (result.messageId) console.log(`      Message ID: ${result.messageId}`);
          if (result.error) console.log(`      Error: ${result.error}`);
        });
      }
      
      // Agregar información de correos a la respuesta
      completeOrder.emails_sent = true;
      completeOrder.email_summary = emailResult.summary;
      completeOrder.email_products_count = productsForEmail.length;
      
    } catch (emailError) {
      console.error('❌ ERROR EN ENVÍO DE CORREOS:', emailError.message);
      console.error('📝 Error detallado:', emailError);
      // No fallar la respuesta principal si fallan los correos
      completeOrder.emails_sent = false;
      completeOrder.email_error = emailError.message;
    }

    console.log('='.repeat(60));
    console.log('🎯 ORDEN PROCESADA COMPLETAMENTE');
    console.log('='.repeat(60));

    // 4. Responder al frontend
    res.json({
      success: true,
      message: 'Orden guardada correctamente',
      order: completeOrder,
      order_number: completeOrder.order_number,
      emails_sent: completeOrder.emails_sent || false,
      email_debug: {
        products_count: completeOrder.email_products_count,
        sample_product: completeOrder.items && completeOrder.items.length > 0 ? 
          formatProductsForEmail([completeOrder.items[0]])[0] : null
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ ERROR AL GUARDAR ORDEN:', error.message);
    console.error('📝 Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error al guardar la orden',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Reenviar correos para una orden existente
router.post('/:orderId/resend-emails', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    console.log('='.repeat(50));
    console.log(`📧 REENVIANDO CORREOS PARA ORDEN: ${orderId}`);
    console.log('='.repeat(50));
    console.log('👤 Usuario:', req.user.email);

    // Obtener los detalles completos de la orden
    const query = `
      SELECT 
        o.*,
        u.email as user_email,
        u.nombre as user_nombre,
        u.username,
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
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1 AND o.user_id = $2
      GROUP BY o.id, u.id, u.email, u.nombre, u.username
    `;

    const result = await db.query(query, [orderId, userId]);
    
    if (result.rows.length === 0) {
      console.log('❌ Orden no encontrada o no pertenece al usuario');
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    const order = formatOrderResponse(result.rows[0]);
    const row = result.rows[0];

    // Formatear productos para el correo
    const productsForEmail = formatProductsForEmail(order.items || []);

    // Preparar datos para el correo
    const emailData = {
      orderId: order.id,
      buyerEmail: order.customer_email || row.user_email,
      buyerName: order.customer_name || row.user_nombre || row.username,
      orderNumber: order.order_number,
      products: productsForEmail,
      totalAmount: order.total_amount,
      orderDate: new Date(order.created_at).toLocaleDateString('es-MX'),
      paymentMethod: 'Mercado Pago',
      shippingAddress: order.shipping_address
    };

    console.log('📨 Datos para reenvío:');
    console.log('   📧 Para:', emailData.buyerEmail);
    console.log('   🏷️ Orden:', emailData.orderNumber);
    console.log('   📦 Productos:', emailData.products.length);
    if (emailData.products.length > 0) {
      console.log('   📋 Muestra de producto:', JSON.stringify(emailData.products[0], null, 2));
    }

    // Enviar correos
    console.log('🚀 Enviando correos...');
    const emailResult = await sendOrderEmails(emailData);
    
    console.log('✅ CORREOS REENVIADOS EXITOSAMENTE');
    console.log('📊 Resumen:', emailResult.summary);

    res.json({
      success: true,
      message: 'Correos reenviados exitosamente',
      emailsResults: emailResult.results || [],
      summary: emailResult.summary || { total: 0, successful: 0, failed: 0 },
      debug: {
        products_sent: productsForEmail.length,
        sample_product: productsForEmail.length > 0 ? productsForEmail[0] : null
      }
    });

  } catch (error) {
    console.error('❌ Error reenviando correos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reenviar los correos',
      error: error.message
    });
  }
});

// ==================== ENDPOINTS DE CONSULTA ====================

// Obtener historial de órdenes del usuario
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('📊 Obteniendo historial para usuario:', userId, req.user.email);

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
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;

    const result = await db.query(query, [userId]);
    
    console.log(`✅ Se encontraron ${result.rows.length} órdenes para el usuario ${userId}`);
    
    const formattedOrders = result.rows.map(row => formatOrderResponse(row));

    res.json({
      success: true,
      orders: formattedOrders,
      count: formattedOrders.length
    });

  } catch (error) {
    console.error('❌ Error al obtener historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el historial de órdenes',
      error: error.message
    });
  }
});

// Obtener detalles de una orden específica
router.get('/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    console.log('🔍 Obteniendo detalles de orden:', orderId, 'para usuario:', userId);

    const query = `
      SELECT 
        o.*,
        u.username,
        u.email as user_email,
        u.nombre as user_nombre,
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
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1 AND o.user_id = $2
      GROUP BY o.id, u.id, u.username, u.email, u.nombre
    `;

    const result = await db.query(query, [orderId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    const order = formatOrderResponse(result.rows[0]);
    
    console.log('✅ Detalles de orden obtenidos:', order.order_number);
    
    res.json({
      success: true,
      order: order
    });

  } catch (error) {
    console.error('Error al obtener orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la orden'
    });
  }
});

// Endpoint de debug para última orden
router.get('/debug/last-order', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('🔍 DEBUG: Obteniendo última orden para usuario:', userId);

    const query = `
      SELECT o.*, 
             COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 1
    `;
    
    const result = await db.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.json({
        success: false,
        message: 'No hay órdenes para este usuario'
      });
    }
    
    const order = result.rows[0];
    
    res.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        customer_email: order.customer_email,
        customer_name: order.customer_name,
        created_at: order.created_at,
        total_amount: order.total_amount,
        items_count: order.items_count
      },
      debug: {
        email_service: {
          EMAIL_USER: process.env.EMAIL_USER ? 'Configurado' : 'NO CONFIGURADO',
          EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
          NODE_ENV: process.env.NODE_ENV || 'development'
        },
        server_time: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Obtener todas las órdenes (para administradores)
router.get('/admin/orders', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a esta información'
      });
    }

    console.log('📊 Administrador solicitando todas las órdenes:', req.user.email);

    const query = `
      SELECT 
        o.*,
        u.username,
        u.email as user_email,
        u.nombre as user_nombre,
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
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id, u.id, u.username, u.email, u.nombre
      ORDER BY o.created_at DESC
    `;

    const result = await db.query(query);
    
    console.log(`✅ Se encontraron ${result.rows.length} órdenes`);

    const formattedOrders = result.rows.map(row => {
      const order = formatOrderResponse(row);
      
      if (!order.shipping_address || Object.keys(order.shipping_address).length === 0) {
        order.shipping_address = {
          nombre: order.customer_name || row.user_nombre || row.username,
          email: order.customer_email || row.user_email,
          telefono: order.customer_phone || ''
        };
      }
      
      if (!order.customer_name && order.shipping_address.nombre) {
        order.customer_name = order.shipping_address.nombre;
      }
      if (!order.customer_email && order.shipping_address.email) {
        order.customer_email = order.shipping_address.email;
      }
      if (!order.customer_phone && order.shipping_address.telefono) {
        order.customer_phone = order.shipping_address.telefono;
      }
      
      return order;
    });

    res.json({
      success: true,
      orders: formattedOrders,
      count: formattedOrders.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al obtener todas las órdenes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las órdenes',
      error: error.message
    });
  }
});

// Obtener estadísticas de órdenes (para administradores)
router.get('/admin/stats', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a esta información'
      });
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_orders,
        COUNT(*) FILTER (WHERE status = 'processing') as processing_orders,
        COUNT(*) FILTER (WHERE status = 'shipped') as shipped_orders,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered_orders,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_order_value
      FROM orders
    `;

    const recentOrdersQuery = `
      SELECT 
        COUNT(*) as recent_orders,
        SUM(total_amount) as recent_revenue
      FROM orders 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    `;

    const topProductsQuery = `
      SELECT 
        oi.product_code,
        oi.product_name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.total_price) as total_revenue
      FROM order_items oi
      GROUP BY oi.product_code, oi.product_name
      ORDER BY total_sold DESC
      LIMIT 10
    `;

    const [statsResult, recentResult, topProductsResult] = await Promise.all([
      db.query(statsQuery),
      db.query(recentOrdersQuery),
      db.query(topProductsQuery)
    ]);

    const stats = statsResult.rows[0];
    const recent = recentResult.rows[0];
    const topProducts = topProductsResult.rows;

    res.json({
      success: true,
      stats: {
        total_orders: parseInt(stats.total_orders) || 0,
        confirmed_orders: parseInt(stats.confirmed_orders) || 0,
        processing_orders: parseInt(stats.processing_orders) || 0,
        shipped_orders: parseInt(stats.shipped_orders) || 0,
        delivered_orders: parseInt(stats.delivered_orders) || 0,
        cancelled_orders: parseInt(stats.cancelled_orders) || 0,
        completed_orders: parseInt(stats.completed_orders) || 0,
        total_revenue: parseFloat(stats.total_revenue) || 0,
        average_order_value: parseFloat(stats.average_order_value) || 0,
        recent_orders: parseInt(recent.recent_orders) || 0,
        recent_revenue: parseFloat(recent.recent_revenue) || 0,
        top_products: topProducts
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las estadísticas'
    });
  }
});

// Actualizar estado de una orden (para administradores)
router.put('/admin/orders/:orderId/status', auth, async (req, res) => {
  const client = await db.connect();
  
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    const { orderId } = req.params;
    const { status, notifyCustomer = false } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'completed'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido'
      });
    }

    await client.query('BEGIN');

    const query = `
      UPDATE orders 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await client.query(query, [status, orderId]);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    await client.query('COMMIT');

    const updatedOrder = formatOrderResponse(result.rows[0]);
    
    // Enviar correo de actualización si se solicita
    if (notifyCustomer) {
      try {
        const statusMessages = {
          'shipped': 'tu pedido ha sido enviado',
          'delivered': 'tu pedido ha sido entregado',
          'cancelled': 'tu pedido ha sido cancelado'
        };
        
        if (statusMessages[status]) {
          console.log(`📧 Enviando notificación de estado ${status} al cliente`);
          // Aquí podrías implementar una función específica para correos de actualización de estado
        }
      } catch (emailError) {
        console.error('❌ Error enviando notificación de estado:', emailError);
        // No fallar la operación principal
      }
    }
    
    res.json({
      success: true,
      message: 'Estado actualizado correctamente',
      order: updatedOrder
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado'
    });
  } finally {
    client.release();
  }
});

// Obtener órdenes por estado (para administradores)
router.get('/admin/orders/status/:status', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a esta información'
      });
    }

    const { status } = req.params;
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'completed'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido'
      });
    }

    const query = `
      SELECT 
        o.*,
        u.username,
        u.email as user_email,
        u.nombre as user_nombre,
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
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status = $1
      GROUP BY o.id, u.id, u.username, u.email, u.nombre
      ORDER BY o.created_at DESC
    `;

    const result = await db.query(query, [status]);
    
    const formattedOrders = result.rows.map(row => {
      const order = formatOrderResponse(row);
      
      if (!order.shipping_address || Object.keys(order.shipping_address).length === 0) {
        order.shipping_address = {
          nombre: order.customer_name || row.user_nombre || row.username,
          email: order.customer_email || row.user_email,
          telefono: order.customer_phone || ''
        };
      }
      
      return order;
    });

    res.json({
      success: true,
      orders: formattedOrders
    });

  } catch (error) {
    console.error('Error al obtener órdenes por estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las órdenes'
    });
  }
});

// Eliminar una orden (para administradores)
router.delete('/admin/orders/:orderId', auth, async (req, res) => {
  const client = await db.connect();
  
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    const { orderId } = req.params;

    await client.query('BEGIN');

    const checkQuery = `
      SELECT status, order_number FROM orders WHERE id = $1
    `;
    const checkResult = await client.query(checkQuery, [orderId]);
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    const orderStatus = checkResult.rows[0].status;
    const orderNumber = checkResult.rows[0].order_number;
    const allowedStatuses = ['pending', 'cancelled'];
    
    if (!allowedStatuses.includes(orderStatus)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden eliminar órdenes pendientes o canceladas'
      });
    }

    // Eliminar items de la orden primero
    const deleteItemsQuery = `DELETE FROM order_items WHERE order_id = $1`;
    await client.query(deleteItemsQuery, [orderId]);

    // Eliminar la orden
    const deleteOrderQuery = `DELETE FROM orders WHERE id = $1 RETURNING *`;
    const deleteResult = await client.query(deleteOrderQuery, [orderId]);

    await client.query('COMMIT');

    console.log(`🗑️ Orden LUCESA eliminada: ${orderNumber}`);

    res.json({
      success: true,
      message: 'Orden eliminada correctamente',
      order: deleteResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la orden'
    });
  } finally {
    client.release();
  }
});

// Obtener detalles completos de una orden (para administradores)
router.get('/admin/orders/:orderId/details', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a esta información'
      });
    }

    const { orderId } = req.params;

    const query = `
      SELECT 
        o.*,
        u.id as user_id,
        u.username,
        u.email as user_email,
        u.nombre as user_nombre,
        u.created_at as user_created_at,
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
            'created_at', oi.created_at
          )
        ) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id, u.id, u.username, u.email, u.nombre, u.created_at
    `;

    const result = await db.query(query, [orderId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    const row = result.rows[0];
    const order = formatOrderResponse(row);
    
    // Formatear la respuesta con información completa
    const formattedOrder = {
      ...order,
      customer_info: {
        user_id: row.user_id,
        username: row.username,
        email: row.user_email,
        nombre: row.user_nombre,
        telefono: order.customer_phone,
        member_since: row.user_created_at
      }
    };

    res.json({
      success: true,
      order: formattedOrder
    });

  } catch (error) {
    console.error('Error al obtener detalles de orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los detalles de la orden'
    });
  }
});

// Nueva ruta para probar renderizado de plantilla
router.post('/test-template-render', auth, async (req, res) => {
  try {
    const { loadTemplate } = require('../utils/emailServiceG');
    
    const testData = {
      sellerName: 'Administrador Lucesa',
      buyerName: 'pruebapago',
      buyerEmail: 'test_user_6845195898286819717@testuser.com',
      orderNumber: 'LUCESA-1765166598000',
      orderDate: '7/12/2025',
      totalAmount: '$15598.09 MXN',
      shippingInfo: 'Dirección de prueba',
      products: [
        {
          name: 'Producto de Prueba 1',
          code: 'CODE001',
          quantity: 1,
          totalPrice: '13446.63'
        }
      ]
    };
    
    const html = loadTemplate('order-seller', testData);
    
    res.json({
      success: true,
      html_preview: html.substring(0, 500) + '...',
      data_used: testData,
      products_in_template: testData.products.map(p => ({
        name: p.name,
        code: p.code,
        quantity: p.quantity,
        totalPrice: p.totalPrice
      }))
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    });
  }
});

module.exports = router;