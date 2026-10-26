const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { MercadoPagoConfig, Payment } = require('mercadopago');

const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const client = new MercadoPagoConfig({ accessToken: token });
const payment = new Payment(client);

async function checkPseDetails() {
  const p = await payment.get({ id: '184387189593' });
  console.log('Detalle de PSE 184387189593:');
  console.log('Status:', p.status);
  console.log('Status Detail:', p.status_detail);
  console.log('Payment Method:', p.payment_method_id);
  console.log('Payment Type:', p.payment_type_id);
  console.log('Transaction Details:', p.transaction_details);
  console.log('Callback URL:', p.callback_url);
  process.exit(0);
}

checkPseDetails();
