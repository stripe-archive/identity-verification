const express = require('express');
const app = express();

// Copy the .env.example in the root into a .env file in this folder
const env = require('dotenv').config({ path: './.env' });
const { resolve } = require('path');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const stripeResource = require('stripe').StripeResource;

let verificationIntentId;

// console.log('%c stripe', stripe);
// console.log('%c stripe resource', stripeResource);

app.use(express.static(process.env.STATIC_DIR));
app.use(
  express.json({
    // We need the raw body to verify webhook signatures.
    // Let's compute it only when hitting the Stripe webhook endpoint.
    verify: function(req, res, buf) {
      if (req.originalUrl.startsWith('/webhook')) {
        req.rawBody = buf.toString();
      }
    }
  })
);


/*
 * Serve homepage
 */
app.get('/', (req, res) => {
  // Display sign up page
  const path = resolve(process.env.STATIC_DIR + '/index.html');
  res.sendFile(path);
});


/*
 * Serve return_url page
 */
app.get('/next-step', (req, res) => {
  // TODO: handle return-url
  const path = resolve(process.env.STATIC_DIR + '/next-step.html');
  res.sendFile(path);
});


/*
 * Handler for creating the VerificationIntent
 */
app.post('/create-verification-intent', async (req, res) => {
  // console.log('%c create VI', req, res);
  // console.log(req.get('host'), req.get('origin'));
  const verificationIntent = stripeResource.extend({
    request: stripeResource.method({
      method: 'POST',
      path: 'identity/verification_intents',
    })
  });

  new verificationIntent(stripe).request({
    'return_url': req.get('origin') + '/return-url',
    'requested_verifications': [
      'identity_document',
    ]
  }, (err, response) => {
    // asynchronously called
    // console.log('%c VI response', err, response);
    if (err) {
      console.log('(!) Error:\n', error.raw);
      res.send(err);
    } else if (response) {
      console.log('VI created:\n', response);
      res.send(response);
    }
  });
});


/*
 * Webhook handler for asynchronous events.
 */
app.post('/webhook', async (req, res) => {
  // Check if webhook signing is configured.
  if (env.parsed.STRIPE_WEBHOOK_SECRET) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    let signature = req.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        env.parsed.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`);
      return res.sendStatus(400);
    }
    data = event.data;
    eventType = event.type;
  } else {
    // Webhook signing is recommended, but if the secret is not configured in `config.js`,
    // we can retrieve the event data directly from the request body.
    data = req.body.data;
    eventType = req.body.type;
  }

  //TODO handle verification_intent event

  if (eventType === 'payment_intent.amount_capturable_updated') {
    console.log(`❗ Charging the card for: ${data.object.amount_capturable}`);
    // You can capture an amount less than or equal to the amount_capturable
    // By default capture() will capture the full amount_capturable
    // To cancel a payment before capturing use .cancel() (https://stripe.com/docs/api/payment_intents/cancel)
    const intent = await stripe.paymentIntents.capture(data.object.id);
  } else if (eventType === 'payment_intent.succeeded') {
    // Funds have been captured
    // Fulfill any orders, e-mail receipts, etc
    // To cancel the payment after capture you will need to issue a Refund (https://stripe.com/docs/api/refunds)
    console.log('💰 Payment captured!');
  } else if (eventType === 'payment_intent.payment_failed') {
    console.log('❌ Payment failed.');
  }
  res.sendStatus(200);
});

app.listen(4242, () => console.log(`Node server listening on port ${4242}!`));
