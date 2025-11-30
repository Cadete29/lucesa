// backend/config/mercadopago.js

const { MercadoPagoConfig, Preference } = require('mercadopago');

// Verificar que el access token existe
if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
  console.error('❌ MERCADO_PAGO_ACCESS_TOKEN no está definido en las variables de entorno');
  throw new Error('MERCADO_PAGO_ACCESS_TOKEN es requerido');
}

console.log('🔑 Configurando Mercado Pago con token:', 
  process.env.MERCADO_PAGO_ACCESS_TOKEN ? '✅ Presente' : '❌ Faltante');

// Configuración principal
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  options: { 
    timeout: 5000,
    idempotencyKey: 'lucesa-payments'
  }
});

console.log('✅ Cliente de Mercado Pago configurado');

// Crear instancia de Preference
const preferenceClient = new Preference(client);
console.log('✅ Cliente de Preference configurado');

// Exportar la instancia, no la clase
module.exports = {
  mercadopagoClient: client,
  preferenceClient: preferenceClient  // Exportar la instancia
};