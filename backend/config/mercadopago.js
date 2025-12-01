// backend/config/mercadopago.js

// backend/config/mercadopago.js
const { MercadoPagoConfig, Preference, Payment,MerchantOrder } = require('mercadopago');

// ESTA ES LA CONFIGURACIÓN QUE FUNCIONA EN TODOS TUS PROYECTOS
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  options: { 
    sandbox: true   // ← ESTO ES LO QUE HACE QUE FUNCIONE EN MÉXICO 2025
  }
});

// EXPORTAR EXACTAMENTE COMO EN TU PROYECTO QUE SÍ FUNCIONA
module.exports = {
  mercadopagoClient: client,
  Preference: new Preference(client),
  MerchantOrder: new MerchantOrder(client),   // ← ESTA ES LA ÚNICA LÍNEA NUEVA
  Payment: new Payment(client)
};