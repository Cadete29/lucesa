const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middlewares/authenticateTokenG.js');

// Obtener todas las devoluciones
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a esta información'
      });
    }

    const query = `
      SELECT * FROM returns 
      ORDER BY created_at DESC
    `;

    const result = await db.query(query);
    
    res.json({
      success: true,
      returns: result.rows
    });

  } catch (error) {
    console.error('Error al obtener devoluciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las devoluciones'
    });
  }
});

// Crear nueva devolución
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
      purchase_amount,
      return_date,
      serial_number,
      return_reason,
      observations,
      status,
      ticket_number
    } = req.body;

    await client.query('BEGIN');

    // Verificar si el ticket ya existe
    const checkTicketQuery = `SELECT id FROM returns WHERE ticket_number = $1`;
    const checkResult = await client.query(checkTicketQuery, [ticket_number]);
    
    if (checkResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'El número de ticket ya existe'
      });
    }

    const query = `
      INSERT INTO returns (
        order_number,
        product_code,
        product_name,
        customer_name,
        customer_email,
        purchase_amount,
        return_date,
        serial_number,
        return_reason,
        observations,
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
      purchase_amount,
      return_date,
      serial_number,
      return_reason,
      observations || null,
      status,
      ticket_number
    ];

    const result = await client.query(query, values);
    const newReturn = result.rows[0];

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Devolución creada correctamente',
      return: newReturn
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear devolución:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la devolución'
    });
  } finally {
    client.release();
  }
});

// Actualizar estado de devolución
router.put('/:returnId/status', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    const { returnId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pendiente', 'aprobada', 'rechazada', 'completada'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido'
      });
    }

    const query = `
      UPDATE returns 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(query, [status, returnId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Devolución no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Estado actualizado correctamente',
      return: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar estado de devolución:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado'
    });
  }
});

// Buscar devoluciones
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
      SELECT * FROM returns 
      WHERE 
        ticket_number ILIKE $1 OR
        order_number ILIKE $1 OR
        product_name ILIKE $1 OR
        product_code ILIKE $1 OR
        customer_name ILIKE $1 OR
        customer_email ILIKE $1 OR
        serial_number ILIKE $1 OR
        return_reason ILIKE $1 OR
        observations ILIKE $1
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [searchTerm]);
    
    res.json({
      success: true,
      returns: result.rows
    });

  } catch (error) {
    console.error('Error buscando devoluciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar devoluciones'
    });
  }
});

// Obtener devolución por ID
router.get('/:returnId', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a esta información'
      });
    }

    const { returnId } = req.params;

    const query = `
      SELECT * FROM returns WHERE id = $1
    `;

    const result = await db.query(query, [returnId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Devolución no encontrada'
      });
    }

    res.json({
      success: true,
      return: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener devolución:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la devolución'
    });
  }
});

// Eliminar devolución
router.delete('/:returnId', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    const { returnId } = req.params;

    const query = `
      DELETE FROM returns WHERE id = $1 RETURNING *
    `;

    const result = await db.query(query, [returnId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Devolución no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Devolución eliminada correctamente',
      return: result.rows[0]
    });

  } catch (error) {
    console.error('Error al eliminar devolución:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la devolución'
    });
  }
});

// Obtener estadísticas de devoluciones
router.get('/stats/summary', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a esta información'
      });
    }

    const query = `
      SELECT 
        COUNT(*) as total_returns,
        COUNT(*) FILTER (WHERE status = 'pendiente') as pending_returns,
        COUNT(*) FILTER (WHERE status = 'aprobada') as approved_returns,
        COUNT(*) FILTER (WHERE status = 'rechazada') as rejected_returns,
        COUNT(*) FILTER (WHERE status = 'completada') as completed_returns,
        SUM(purchase_amount) FILTER (WHERE status = 'aprobada') as total_approved_amount,
        AVG(purchase_amount) as average_return_amount
      FROM returns
    `;

    const result = await db.query(query);
    const stats = result.rows[0];

    // Razones más comunes de devolución
    const reasonsQuery = `
      SELECT 
        return_reason,
        COUNT(*) as count
      FROM returns 
      GROUP BY return_reason 
      ORDER BY count DESC 
      LIMIT 10
    `;

    const reasonsResult = await db.query(reasonsQuery);

    res.json({
      success: true,
      stats: {
        total_returns: parseInt(stats.total_returns) || 0,
        pending_returns: parseInt(stats.pending_returns) || 0,
        approved_returns: parseInt(stats.approved_returns) || 0,
        rejected_returns: parseInt(stats.rejected_returns) || 0,
        completed_returns: parseInt(stats.completed_returns) || 0,
        total_approved_amount: parseFloat(stats.total_approved_amount) || 0,
        average_return_amount: parseFloat(stats.average_return_amount) || 0,
        top_reasons: reasonsResult.rows
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas de devoluciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las estadísticas'
    });
  }
});

module.exports = router;