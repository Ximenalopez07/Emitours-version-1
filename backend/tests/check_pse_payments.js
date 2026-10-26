const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { MercadoPagoConfig, Payment } = require('mercadopago');

const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const client = new MercadoPagoConfig({ accessToken: token });
const payment = new Payment(client);

async function checkPsePayments() {
  try {
    const searchRes = await payment.search({
      options: {
        payment_method_id: 'pse',
        sort: 'date_created',
        criteria: 'desc',
        limit: 5
      }
    });

    console.log(`Transacciones PSE encontradas en la cuenta: ${searchRes.results ? searchRes.results.length : 0}`);
    if (searchRes.results && searchRes.results.length > 0) {
      searchRes.results.forEach(p => {
        console.log(`- ID: ${p.id} | Metodo: ${p.payment_method_id} | Estado: ${p.status} (${p.status_detail}) | Monto: ${p.transaction_amount} | Fecha: ${p.date_created}`);
      });
    }
  } catch (err) {
    console.error('Error al buscar PSE en MP:', err.message);
  }
  process.exit(0);
}

checkPsePayments();
