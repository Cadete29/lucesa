const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middlewares/authenticateTokenG.js');

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
      nombre: item.product_name, // Alias para frontend
      codigo: item.product_code, // Alias para frontend
      product_brand: item.product_brand,
      marca: item.product_brand, // Alias para frontend
      product_image_url: item.product_image_url,
      unit_price: parseFloat(item.unit_price) || 0,
      precio: parseFloat(item.unit_price) || 0, // Alias para frontend
      precioFinal: parseFloat(item.unit_price) || 0, // Alias para frontend
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

// Obtener todas las órdenes (para administradores)
router.get('/admin/orders', auth, async (req, res) => {
  try {
    // Verificar si el usuario es administrador
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

    // Formatear cada orden
    const formattedOrders = result.rows.map(row => {
      const order = formatOrderResponse(row);
      
      // Asegurar que la dirección de envío tenga toda la información disponible
      if (!order.shipping_address || Object.keys(order.shipping_address).length === 0) {
        order.shipping_address = {
          nombre: order.customer_name || row.user_nombre || row.username,
          email: order.customer_email || row.user_email,
          telefono: order.customer_phone || ''
        };
      }
      
      // Si los campos individuales están vacíos pero la dirección tiene datos, usarlos
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
      error: error.message,
      fallbackError: error.message
    });
  }
});

// Guardar nueva orden
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
    console.log(`🔢 Backend generando orden LUCESA: ${orderNumber} para usuario ${userId}`);

    // Parsear shipping address
    let parsedShippingAddress = null;
    if (shippingAddress) {
      try {
        parsedShippingAddress = typeof shippingAddress === 'string' 
          ? JSON.parse(shippingAddress)
          : shippingAddress;
      } catch (error) {
        console.warn('Error parseando shippingAddress:', error);
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

    const orderResult = await client.query(orderQuery, orderValues);
    const savedOrder = orderResult.rows[0];
    console.log(`✅ Orden LUCESA creada: ${savedOrder.order_number}, ID: ${savedOrder.id}`);

    // 2. Insertar items de la orden
    if (cartItems && cartItems.length > 0) {
      const IMAGE_BASE_URL = process.env.NODE_ENV === 'production' 
        ? 'https://testpaginaweb.shop/api/images/code'
        : 'http://localhost:4004/api/images/code';

      console.log(`📦 Insertando ${cartItems.length} items para orden ${savedOrder.order_number}`);

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
      
      console.log(`✅ ${cartItems.length} items insertados para orden ${savedOrder.order_number}`);
    }

    await client.query('COMMIT');

    // Obtener la orden completa con sus items
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

    console.log(`📤 Enviando respuesta con orden LUCESA: ${completeOrder.order_number}`);

    res.json({
      success: true,
      message: 'Orden guardada correctamente',
      order: completeOrder,
      order_number: completeOrder.order_number
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error al guardar orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar la orden',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Obtener historial de órdenes del usuario - CORREGIDO
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
    
    // Debug: Mostrar primera orden
    if (result.rows.length > 0) {
      console.log('📋 Primera orden:', {
        order_number: result.rows[0].order_number,
        items_count: result.rows[0].items?.length || 0,
        items: result.rows[0].items
      });
    }
    
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
    const { status } = req.body;

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
        telefono: order.customer_phone, // Usar customer_phone de la tabla orders
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

module.exports = router;