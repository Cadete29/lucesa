// backend/utils/orderGenerator.js

/**
 * Genera un número de orden único para Lucesa
 * Formato: LUCESA-YYYYMMDD-XXXXX
 */
const generateOrderNumber = () => {
  const now = new Date();
  
  // Parte de fecha: YYYYMMDD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePart = `${year}${month}${day}`;
  
  // Parte secuencial: 5 dígitos aleatorios
  const sequentialPart = String(Math.floor(Math.random() * 90000) + 10000);
  
  return `LUCESA-${datePart}-${sequentialPart}`;
};

/**
 * Verifica si un número de orden ya existe en la base de datos
 */
const isOrderNumberUnique = async (db, orderNumber) => {
  try {
    const result = await db.query(
      'SELECT id FROM orders WHERE order_number = $1',
      [orderNumber]
    );
    return result.rows.length === 0;
  } catch (error) {
    console.error('Error verificando unicidad de orden:', error);
    return false;
  }
};

/**
 * Genera un número de orden único que no exista en la base de datos
 */
const generateUniqueOrderNumber = async (db) => {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const orderNumber = generateOrderNumber();
    const isUnique = await isOrderNumberUnique(db, orderNumber);
    
    if (isUnique) {
      return orderNumber;
    }
    
    attempts++;
    console.log(`Intento ${attempts}: Número de orden ${orderNumber} ya existe, generando nuevo...`);
  }
  
  // Si no se encuentra único después de 10 intentos, usar timestamp
  return `LUCESA-${Date.now()}`;
};

module.exports = {
  generateOrderNumber,
  generateUniqueOrderNumber
};