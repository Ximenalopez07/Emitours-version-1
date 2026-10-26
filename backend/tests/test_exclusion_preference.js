const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { MercadoPagoConfig, Preference } = require('mercadopago');

const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const client = new MercadoPagoConfig({ accessToken: token });
const preference = new Preference(client);

async function testExclusionPreference() {
  try {
    const res = await preference.create({
      body: {
        items: [
          {
            id: 'TOUR-1',
            title: 'EmiTours: Pablo Escobar (Pago 100%)',
            description: 'Tour para 1 persona',
            quantity: 1,
            unit_price: 150000,
            currency_id: 'COP'
          }
        ],
        back_urls: {
          success: 'http://localhost:5173/reservas',
          failure: 'http://localhost:5173/reservas',
          pending: 'http://localhost:5173/reservas'
        },
        payment_methods: {
          excluded_payment_types: [
            { id: 'bank_transfer' }
          ],
          installments: 12
        },
        external_reference: `EMT-TEST-${Date.now()}`
      }
    });

    console.log('[Test Exclusión Exitoso]');
    console.log('ID:', res.id);
    console.log('Sandbox URL:', res.sandbox_init_point);
    console.log('Payment Methods Config:', res.payment_methods);
  } catch (err) {
    console.error('[Test Error]:', err);
  }
}

testExclusionPreference();
