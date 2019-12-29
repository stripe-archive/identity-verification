// Copy the .env.example in the root into a .env file in this folder
const env = require('dotenv').config({ path: './.env' });
const { resolve } = require('path');

// Express
const express = require('express');
const app = express();

// Websocket
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

// Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const StripeResource = require('stripe').StripeResource;

const uuid = require('uuid/v4');

// Cache
const cache = require('./store');

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
  // TODO handle return_url states
  const path = resolve(process.env.STATIC_DIR + '/next-step.html');
  res.sendFile(path);
});


/*
 * Handler for creating the VerificationIntent
 */
app.post('/create-verification-intent', async (req, res) => {
  verificationIntent.create({
    return_url: req.get('origin') + '/next-step?verification_intent_id={VERIFICATION_INTENT_ID}',
    requested_verifications: [
      'identity_document',
    ],
    metadata: {
      userId: uuid(), // optional: pass a user's ID through the VerificationIntent API
    },
  }, (error, response) => {
    // asynchronously called
    if (error) {
      console.log('\nError:\n', erroror.raw);
      res.send(error);
    } else if (response) {
      // console.log('\nVerificationIntent created:\n', response);
      if (response.id) {
        cache.upsert(response.id, response);
        res.send(response);
      } else {
        res.status(500).send({
          errororMessage: 'Verification intent contained no ID'
        });
      }
    }
  });
});


/*
 * Webhook handler for asynchronous events.
 */
app.post('/webhook', async (req, res) => {
  let data;
  // Check if webhook signing is configured.
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    let signature = req.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.log('\nWebhook signature verification failed.');
      console.log(error);
      return res.sendStatus(400);
    }
    data = event.data.object;
    eventType = event.type;
  } else {
    // Webhook signing is recommended, but if the secret is not configured in `config.js`,
    // we can retrieve the event data directly from the request body.
    data = req.body.data.object;
    eventType = req.body.type;
  }

  // console.log('\nwebhook:eventType', eventType);
  switch (eventType) {
    case 'identity.verification_intent.created':
      console.log('\nVerificationIntent created');
      break;
    case 'identity.verification_intent.updated':
    case 'identity.verification_intent.succeeded':
      cache.upsert(data.id, data);
      const { socketId } = getStaticValue(data.id, 'socketId');
      if (socketId) {
        io.to(socketId).emit('verification_result', data.verifications[0].status);
      } else {
        console.log('No socket ID');
      }
      break;
  }

  res.sendStatus(200);
});


/*
 * Handle 404 responses
 */
app.use(function (req, res, next) {
  const path = resolve(process.env.STATIC_DIR + '/404.html');
  res.status(404).sendFile(path);
})


const shouldGetUpdatedVerification = (latestVerification) => (
  !(latestVerification && (
    latestVerification.status === 'succeeded' &&
    latestVerification.status === 'requires_action' &&
    latestVerification.errorType
  ))
);
exports.shouldGetUpdatedVerification = shouldGetUpdatedVerification;

/*
 * Handle websocket connection
 */
io.on('connect', (socket) => {
  console.log('socket: connect:\t', socket.id);

  socket.on('init', (data) => {
    const { verificationIntentId } = data;
    // TODO: check cache with exponential back-off
    console.log('socket:acknowledge', verificationStore);
    cache.setStaticValue(verificationIntentId, 'socketId', socket.id);

    if (shouldUpdateValue(verificationIntentId, shouldGetUpdatedVerification)) {
      verificationIntent.get(verificationIntentId, (error, response) => {
        if (response) {
          console.log('GET', response.status);
          // response.status = 'processing'; // TODO: remove testing hack
          socket.emit('acknowledge', response.status);
          cache.upsert(response.id, response);
        } else if (error) {
          console.log('error:', error.type);
          cache.upsert(response.id, response);
          socket.emit('exception', {
            errororCode: 'VERIFICATION_INTENT_NOT_FOUND',
            errororMessage: 'Server could not find a recent verification record'
          });
        }
      });
    } else {
      const latestVerification = cache.getLatestValue(verificationIntentId);
      socket.emit('acknowledge', latestVerification.status);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('socket: disconnect:\t', socket.id, reason);
  });
});


// Start server
server.listen(4242, () => console.log(`Node server listening on port ${4242}!`));
