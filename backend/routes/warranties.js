const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middlewares/authenticateTokenG');

// Obtener todas las garantías
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a esta información'
      });
    }

    const query = `
      SELECT * FROM warranties 
      ORDER BY created_at DESC
    `;

    const result = await db.query(query);
    
    res.json({
      success: true,
      warranties: result.rows
    });

  } catch (error) {
    console.error('Error al obtener garantías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las garantías'
    });
  }
});

// Crear nueva garantía
router.post('/', auth, async (req, res) => {
  const client = await db.connect();
  
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    const {
      order_number,
      product_code,
      product_name,
      customer_name,
      customer_email,
      purchase_date,
      purchase_amount,
      warranty_application_date,
      old_serial_number,
      new_serial_number,
      status,
      ticket_number
    } = req.body;

    await client.query('BEGIN');

    // Verificar si el ticket ya existe
    const checkTicketQuery = `SELECT id FROM warranties WHERE ticket_number = $1`;
    const checkResult = await client.query(checkTicketQuery, [ticket_number]);
    
    if (checkResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'El número de ticket ya existe'
      });
    }

    const query = `
      INSERT INTO warranties (
        order_number,
        product_code,
        product_name,
        customer_name,
        customer_email,
        purchase_date,
        purchase_amount,
        warranty_application_date,
        old_serial_number,
        new_serial_number,
        status,
        ticket_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      order_number,
      product_code,
      product_name,
      customer_name,
      customer_email,
      purchase_date,
      purchase_amount,
      warranty_application_date,
      old_serial_number || null,
      new_serial_number || null,
      status,
      ticket_number
    ];

    const result = await client.query(query, values);
    const newWarranty = result.rows[0];

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Garantía creada correctamente',
      warranty: newWarranty
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear garantía:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la garantía'
    });
  } finally {
    client.release();
  }
});

// Actualizar estado de garantía
router.put('/:warrantyId/status', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    const { warrantyId } = req.params;
    const { status } = req.body;

    const validStatuses = ['activa', 'aplicada', 'expirada'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido'
      });
    }

    const query = `
      UPDATE warranties 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(query, [status, warrantyId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Garantía no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Estado actualizado correctamente',
      warranty: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar estado de garantía:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado'
    });
  }
});

// Buscar garantías
router.get('/search', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a esta información'
      });
    }

    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Término de búsqueda requerido'
      });
    }

    const searchTerm = `%${q}%`;
    
    const query = `
      SELECT * FROM warranties 
      WHERE 
        ticket_number ILIKE $1 OR
        order_number ILIKE $1 OR
        product_name ILIKE $1 OR
        product_code ILIKE $1 OR
        customer_name ILIKE $1 OR
        customer_email ILIKE $1 OR
        old_serial_number ILIKE $1 OR
        new_serial_number ILIKE $1
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [searchTerm]);
    
    res.json({
      success: true,
      warranties: result.rows
    });

  } catch (error) {
    console.error('Error buscando garantías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar garantías'
    });
  }
});

// Obtener garantía por ID
router.get('/:warrantyId', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a esta información'
      });
    }

    const { warrantyId } = req.params;

    const query = `
      SELECT * FROM warranties WHERE id = $1
    `;

    const result = await db.query(query, [warrantyId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Garantía no encontrada'
      });
    }

    res.json({
      success: true,
      warranty: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener garantía:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la garantía'
    });
  }
});

// Eliminar garantía
router.delete('/:warrantyId', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    const { warrantyId } = req.params;

    const query = `
      DELETE FROM warranties WHERE id = $1 RETURNING *
    `;

    const result = await db.query(query, [warrantyId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Garantía no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Garantía eliminada correctamente',
      warranty: result.rows[0]
    });

  } catch (error) {
    console.error('Error al eliminar garantía:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la garantía'
    });
  }
});

module.exports = router;