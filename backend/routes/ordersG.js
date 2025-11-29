// routes/orders.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Tu conexión a PostgreSQL
const auth = require('../middlewares/authenticateTokenG.js');

// Guardar nueva orden
router.post('/', auth, async (req, res) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      orderId,
      total,
      subtotal,
      tax,
      shipping,
      cartItems,
      shippingAddress
    } = req.body;

    const userId = req.user.id;

    // 1. Insertar la orden principal
    const orderQuery = `
      INSERT INTO orders (
        user_id, 
        order_number, 
        total_amount, 
        subtotal, 
        tax_amount, 
        shipping_amount,
        shipping_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const orderValues = [
      userId,
      orderId,
      total,
      subtotal,
      tax,
      shipping,
      shippingAddress ? JSON.stringify(shippingAddress) : null
    ];

    const orderResult = await client.query(orderQuery, orderValues);
    const savedOrder = orderResult.rows[0];

    // 2. Insertar items de la orden
    if (cartItems && cartItems.length > 0) {
      const IMAGE_BASE_URL = process.env.NODE_ENV === 'production' 
        ? 'https://testpaginaweb.shop/api/images/code'
        : 'http://localhost:4004/api/images/code';

      for (const item of cartItems) {
        const imageUrl = `${IMAGE_BASE_URL}/${item.codigo}?size=small`;
        const quantity = item.quantity || 1;
        const unitPrice = item.precioFinal || item.precio || 0;
        const totalPrice = unitPrice * quantity;

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
          item.nombre || 'Producto sin nombre',
          item.marca || 'Sin marca',
          imageUrl,
          unitPrice,
          quantity,
          totalPrice
        ];

        await client.query(itemQuery, itemValues);
      }
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
    const completeOrder = completeOrderResult.rows[0];

    res.json({
      success: true,
      message: 'Orden guardada correctamente',
      order: completeOrder
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al guardar orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar la orden'
    });
  } finally {
    client.release();
  }
});

// Obtener historial de órdenes del usuario
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;

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
    
    res.json({
      success: true,
      orders: result.rows
    });

  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el historial de órdenes'
    });
  }
});

// Obtener detalles de una orden específica
router.get('/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

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
      WHERE o.id = $1 AND o.user_id = $2
      GROUP BY o.id
    `;

    const result = await db.query(query, [orderId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    res.json({
      success: true,
      order: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la orden'
    });
  }
});

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
      GROUP BY o.id, u.id
      ORDER BY o.created_at DESC
    `;

    const result = await db.query(query);
    
    // Formatear la respuesta para incluir información del cliente
    const formattedOrders = result.rows.map(order => {
      return {
        ...order,
        shipping_address: order.shipping_address || {
          nombre: order.user_nombre || order.username,
          email: order.user_email
        }
      };
    });

    res.json({
      success: true,
      orders: formattedOrders
    });

  } catch (error) {
    console.error('Error al obtener todas las órdenes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las órdenes'
    });
  }
});

// Obtener estadísticas de órdenes (para administradores)
router.get('/admin/stats', auth, async (req, res) => {
  try {
    // Verificar si el usuario es administrador
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a esta información'
      });
    }

    // Estadísticas generales
    const statsQuery = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_orders,
        COUNT(*) FILTER (WHERE status = 'processing') as processing_orders,
        COUNT(*) FILTER (WHERE status = 'shipped') as shipped_orders,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered_orders,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_order_value
      FROM orders
    `;

    // Órdenes recientes (últimos 7 días)
    const recentOrdersQuery = `
      SELECT 
        COUNT(*) as recent_orders,
        SUM(total_amount) as recent_revenue
      FROM orders 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    `;

    // Productos más vendidos
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
    // Verificar si el usuario es administrador
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    
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

    // Registrar el cambio de estado en un log (opcional)
    const logQuery = `
      INSERT INTO order_status_log (order_id, previous_status, new_status, changed_by)
      VALUES ($1, $2, $3, $4)
    `;

    // Aquí necesitarías obtener el estado anterior primero
    const previousStatusQuery = `SELECT status FROM orders WHERE id = $1`;
    const previousStatusResult = await client.query(previousStatusQuery, [orderId]);
    const previousStatus = previousStatusResult.rows[0]?.status;

    await client.query(logQuery, [orderId, previousStatus, status, req.user.id]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Estado actualizado correctamente',
      order: result.rows[0]
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
    // Verificar si el usuario es administrador
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a esta información'
      });
    }

    const { status } = req.params;
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    
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
      GROUP BY o.id, u.id
      ORDER BY o.created_at DESC
    `;

    const result = await db.query(query, [status]);
    
    const formattedOrders = result.rows.map(order => {
      return {
        ...order,
        shipping_address: order.shipping_address || {
          nombre: order.user_nombre || order.username,
          email: order.user_email
        }
      };
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

// Eliminar una orden (para administradores) - Solo para órdenes canceladas o pendientes
router.delete('/admin/orders/:orderId', auth, async (req, res) => {
  const client = await db.connect();
  
  try {
    // Verificar si el usuario es administrador
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    const { orderId } = req.params;

    await client.query('BEGIN');

    // Verificar que la orden existe y tiene un estado que permite eliminación
    const checkQuery = `
      SELECT status FROM orders WHERE id = $1
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
    // Verificar si el usuario es administrador
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
      GROUP BY o.id, u.id
    `;

    const result = await db.query(query, [orderId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    const order = result.rows[0];
    
    // Formatear la respuesta con información completa
    const formattedOrder = {
      ...order,
      customer_info: {
        user_id: order.user_id,
        username: order.username,
        email: order.user_email,
        nombre: order.user_nombre,
        member_since: order.user_created_at
      },
      shipping_address: order.shipping_address || {
        nombre: order.user_nombre || order.username,
        email: order.user_email
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