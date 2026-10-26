const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { MercadoPagoConfig, Payment } = require('mercadopago');

const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const client = new MercadoPagoConfig({ accessToken: token });
const payment = new Payment(client);

async function checkPseApprovedDetails() {
  const p = await payment.get({ id: '184347640553' });
  console.log('Detalle de PSE Aprobado 184347640553:');
  console.log('Status:', p.status);
  console.log('Status Detail:', p.status_detail);
  console.log('Payment Method:', p.payment_method_id);
  console.log('Financial Institution:', p.transaction_details ? p.transaction_details.financial_institution : null);
  console.log('Payer:', { email: p.payer?.email, identification: p.payer?.identification });
  process.exit(0);
}

checkPseApprovedDetails();
