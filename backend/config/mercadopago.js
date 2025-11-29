const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

//! CONFIGURACIÓN PRINCIPAL
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  options: { sandbox: true }
});

//? EXPORTAR LOS MÓDULOS QUE NECESITAS
module.exports = {
  mercadopagoClient: client,
  Preference: new Preference(client),
  Payment: new Payment(client)
};