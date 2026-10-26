const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { MercadoPagoConfig, Payment } = require('mercadopago');

const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const client = new MercadoPagoConfig({ accessToken: token });
const payment = new Payment(client);

async function checkRecentMpPayments() {
  try {
    const searchRes = await payment.search({
      options: {
        sort: 'date_created',
        criteria: 'desc',
        limit: 5
      }
    });

    console.log(`Últimos pagos registrados en Mercado Pago (${searchRes.results ? searchRes.results.length : 0}):`);
    if (searchRes.results) {
      searchRes.results.forEach(p => {
        console.log(`- ID: ${p.id} | Metodo: ${p.payment_method_id} | Tipo: ${p.payment_type_id} | Estado: ${p.status} (${p.status_detail}) | Monto: ${p.transaction_amount} COP | Fecha: ${p.date_created}`);
      });
    }
  } catch (err) {
    console.error('Error al buscar pagos en MP:', err.message);
  }
  process.exit(0);
}

checkRecentMpPayments();
