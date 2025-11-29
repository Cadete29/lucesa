// routes/payments.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middlewares/authenticateTokenG.js');
const { Preference } = require('../config/mercadopago'); // ← ASÍ COMO EN TU OTRO PROYECTO
//aqui es donde tengo la falla crep
router.post('/create-checkout', auth, async (req, res) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const { cartItems, shippingAddress, customerInfo } = req.body;
    const userId = req.user.id;

    // Cálculos
    const subtotal = cartItems.reduce((sum, item) => sum + (item.precioFinal || item.precio) * item.quantity, 0);
    const tax = subtotal * 0.16;
    const shipping = subtotal >= 1000 ? 0 : 150;
    const total = subtotal + tax + shipping;

    const orderNumber = 'LUCESA-' + Date.now();

    // Guardar orden
    const orderResult = await client.query(`
      INSERT INTO orders (user_id, order_number, total_amount, subtotal, tax_amount, shipping_amount, shipping_address, status, customer_name, customer_email, customer_phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, $10)
      RETURNING id
    `, [
      userId, orderNumber, total, subtotal, tax, shipping,
      JSON.stringify(shippingAddress),
      `${customerInfo.firstName} ${customerInfo.lastName}`,
      customerInfo.email, customerInfo.phone
    ]);

    const orderId = orderResult.rows[0].id;

    // Guardar ítems
    const IMAGE_BASE_URL = process.env.NODE_ENV === 'production'
      ? 'https://testpaginaweb.shop/api/images/code'
      : 'http://localhost:4004/api/images/code';

    for (const item of cartItems) {
      const imageUrl = `${IMAGE_BASE_URL}/${item.codigo}?size=small`;
      const unitPrice = Number(item.precioFinal || item.precio);

      await client.query(`
        INSERT INTO order_items (order_id, product_code, product_name, product_brand, product_image_url, unit_price, quantity, total_price)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        orderId, item.codigo, item.nombre, item.marca || 'Sin marca',
        imageUrl, unitPrice, item.quantity, unitPrice * item.quantity
      ]);
    }

    // CREAR PREFERENCIA EXACTAMENTE COMO EN TU OTRO PROYECTO
    const mpResponse = await Preference.create({
      body: {
        items: cartItems.map(item => ({
          title: item.nombre,
          unit_price: Number(item.precioFinal || item.precio),
          quantity: item.quantity,
          currency_id: "MXN",
          picture_url: `${IMAGE_BASE_URL}/${item.codigo}?size=medium`
        })),
        back_urls: {
          success: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pago/exito`,
          failure: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pago/error`,
          pending: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pago/pendiente`
        },
        auto_return: "approved",
        external_reference: orderId.toString(),
        notification_url: `${process.env.BACKEND_URL || 'http://localhost:4004'}/api/payments/webhook`,
      }
    });

    // Guardar datos de MP
    await client.query(`
      UPDATE orders SET mp_preference_id = $1, mp_init_point = $2 WHERE id = $3
    `, [mpResponse.id, mpResponse.init_point, orderId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      payment_url: mpResponse.init_point,
      order_number: orderNumber
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creando pago:', error);
    res.status(500).json({ success: false, message: error.message || 'Error del servidor' });
  } finally {
    client.release();
  }
});

module.exports = router;