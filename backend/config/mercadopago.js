// backend/config/mercadopago.js
const { MercadoPagoConfig, Preference, Payment, MerchantOrder } = require('mercadopago');

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  options: { 
    timeout: 5000,
    sandbox: process.env.NODE_ENV !== 'production'
  }
});

module.exports = {
  mercadopagoClient: client,
  Preference: new Preference(client),
  MerchantOrder: new MerchantOrder(client),
  Payment: new Payment(client)
};