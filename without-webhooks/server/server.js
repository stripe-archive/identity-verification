// Copy the .env.example in the root into a new .env file with your API keys
const { resolve } = require('path');
const env = require('dotenv').config({ path: resolve(__dirname, '../../.env') });

// Express
const express = require('express');
const app = express();
const bodyParser = require('body-parser')

// Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
stripe.setApiVersion('2020-03-02; identity_beta=v3');
const StripeResource = require('stripe').StripeResource;

// unique ID's
const uuid = require('uuid/v4');


const VerificationIntent = StripeResource.extend({
  create: StripeResource.method({
    method: 'POST',
    path: 'identity/verification_intents',
  }),
  get: StripeResource.method({
    method: 'GET',
    path: 'identity/verification_intents/{verificationIntentId}',
  })
});
const verificationIntent = new VerificationIntent(stripe);

/*
 * Express middleware
 */
app.use(express.static('./client'));

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

app.use(bodyParser.json());


/*
 * Serve homepage
 */
app.get('/', (req, res) => {
  // Display sign up page
  const path = resolve(__dirname, 'client/index.html');
  res.sendFile(path);
});


/*
 * Serve return_url page
 */
app.get('/next-step', (req, res) => {
  // TODO handle sad path cases
  const path = resolve(__dirname, '../client/next-step.html');
  res.sendFile(path);
});


const respondToClient = (error, responseData, res) => {
  if (error) {
    console.error('\nError:\n', error.raw);
    res.send(error);
  } else if (responseData) {
    // console.log('\nVerificationIntent created:\n', responseData);
    if (responseData.id) {
      res.send(responseData);
    } else {
      res.status(500).send({
        errororMessage: 'VerificationIntent contained no `id` field'
      });
    }
  }
};


/*
 * Handler for creating the VerificationIntent
 */
app.post('/create-verification-intent', async (req, res) => {
  const domain = req.get('origin') || req.header('Referer');
  const {returnUrl} = req.body;

  const verificationIntentParams = {
    requested_verifications: [
      'identity_document',
    ],
    metadata: {
      userId: uuid(), // optional: pass a user's ID through the VerificationIntent API
    },
  }

  if (returnUrl) {
    const returnUrlQueryParam = '?verification_intent_id={VERIFICATION_INTENT_ID}';
    verificationIntentParams.return_url = `${domain}${returnUrl}${returnUrlQueryParam}`;
  }

  verificationIntent.create(verificationIntentParams, (error, responseData) => {
    respondToClient(error, responseData, res);
  });
});

/*
 * Handler for retrieving a VerificationIntent
 */
app.get('/get-verification-intent/:verificationIntentId', async (req, res) => {
  const {verificationIntentId} = req.params;
  verificationIntent.get(verificationIntentId, (error, responseData) => {
    respondToClient(error, responseData, res);
  });
});

/*
 * Handle 404 responses
 */
app.use(function (req, res, next) {
  const path = resolve(__dirname, '../client/404.html');
  res.status(404).sendFile(path);
})


// Start server
const localPort = 4242;
const server = require('http').createServer(app);
server.listen(localPort, () => console.log(`Node server listening on port ${localPort}!`));
