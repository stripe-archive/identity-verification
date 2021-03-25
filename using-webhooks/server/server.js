// Copy the .env.example in the root into a .env file in this folder
const { resolve } = require('path');
const env = require('dotenv').config({ path: resolve(__dirname, '../../.env') });

// ejs
const ejs = require('ejs');

// Express
const express = require('express');
const app = express();

// Websocket
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

// Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
stripe.setApiVersion('2020-03-02; identity_beta=v5');
const StripeResource = require('stripe').StripeResource;

// unique ID's
const uuid = require('uuid/v4');

// cache
const Store = require('./store');
const shouldGetUpdatedVerification = require('./utils').shouldGetUpdatedVerification;


const VerificationSession = StripeResource.extend({
  create: StripeResource.method({
    method: 'POST',
    path: 'identity/verification_sessions',
  }),
  get: StripeResource.method({
    method: 'GET',
    path: 'identity/verification_sessions/{verificationSessionId}',
  })
});
const verificationSession = new VerificationSession(stripe);
const cache = new Store();

/*
 * Express middleware
 */
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

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
  const path = resolve(__dirname, '../client/index.html');
  res.render(path, {stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY});
});

/*
 * Serve return_url page
 */
app.get('/next-step', (req, res) => {
  // TODO handle sad path cases
  const path = resolve(__dirname, '../client/next-step.html');
  res.sendFile(path);
});


/*
 * Handler for creating the VerificationSession
 */
app.post('/create-verification-session', async (req, res) => {
  verificationSessionParams = {
    type: 'document',
    use_stripe_sdk: true,
    options: {
      document: {
        require_id_number: true,
        require_matching_selfie: true,
      },
    },
    metadata: {
      userId: uuid(), // optional: pass a user's ID through the VerificationSession API
    },
  };

  verificationSession.create(verificationSessionParams, (error, response) => {
    // asynchronously called
    if (error) {
      console.log('\nError:\n', error.raw);
      res.send({error});
    } else if (response) {
      // console.log('\nVerificationSession created:\n', response);
      if (response.id) {
        cache.upsert(response.id, response);
        res.send({session: response});
      } else {
        res.status(500).send({
          error: {
            message: 'Verification session contained no ID',
          },
        });
      }
    }
  });
});

/*
 * Webhook handler for asynchronous events.
 */
app.post('/webhook', async (req, res) => {
  let data, eventType;
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

  // use the cached websocket ID to talk to the right client


  // console.log('\nwebhook:eventType', eventType);
  switch (eventType) {
    case 'identity.verification_session.created':
    case 'identity.verification_session.processing':
    case 'identity.verification_report.updated':
    case 'identity.verification_report.verified': 
      // no need to communicate with the client
      console.log(eventType);
      break;
    case 'identity.verification_session.updated':
    case 'identity.verification_session.verified':
      // update the cache
      cache.upsert(data.id, data);
      // use the cached websocket ID to talk to the right client
      const socketId = cache.getStaticValue(data.id, 'socketId');
      if (socketId) {
        io.to(socketId).emit('verification_result', data.status);
      } else {
        console.log('\nNo socket ID');
      }
      break;
    default:
      console.log('\nUnknown event type', eventType);
      break;
  }

  res.sendStatus(200);
});

/*
 * Handle static assets and other pages
 */
app.use(express.static('./client'));

/*
 * Handle 404 responses
 */
app.use(function (req, res, next) {
  const path = resolve(__dirname, '../client/404.html');
  res.status(404).sendFile(path);
})

/*
 * Handle websocket connection
 */
io.on('connect', (socket) => {
  console.log('socket: connect:\t', socket.id, new Date());

  // 'init' event triggers for both new connections and re-connects
  socket.on('init', (data) => {
    const { verificationSessionId } = data;
    console.log('socket: acknowledge:\t', verificationSessionId);

    // store the websocket ID for later
    cache.setStaticValue(verificationSessionId, 'socketId', socket.id);

    // check the cache before calling the VerificationSession API
    // this is especially useful when the API errors and we can exponentially backoff
    let shouldCallApi;
    try {
      const latestVerification = cache.getLatestValue(verificationSessionId);
      shouldCallApi = cache.shouldUpdateValue(
        verificationSessionId, shouldGetUpdatedVerification(latestVerification)
      );
    } catch(error) {
      shouldCallApi = true;
    }

    if (shouldCallApi) {
      console.log('GET request:\t', verificationSessionId);
      verificationSession.get(verificationSessionId, (error, response) => {
        if (response) {
          console.log('GET response:\t', response.status);
          cache.upsert(verificationSessionId, response);
          // response.status = 'processing'; // TODO: remove testing hack
          socket.emit('acknowledge', response.status);
        } else if (error) {
          console.log('error:\t', error.type);
          cache.upsert(verificationSessionId, {error});
          socket.emit('exception', {
            errorCode: 'VERIFICATION_SESSION_NOT_FOUND',
            errorMessage: 'Server could not find a recent verification record'
          });
        }
      });
    } else {
      // retrieve from cache
      const latestVerification = cache.getLatestValue(verificationSessionId);
      console.log('cache:\t', latestVerification)
      if (latestVerification.error) {
        socket.emit('exception', {
          errorCode: 'VERIFICATION_SESSION_NOT_FOUND',
          errorMessage: 'Server could not find a recent verification record'
        });
      } else {
        socket.emit('acknowledge', latestVerification.status);
      }
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('socket: disconnect:\t', socket.id, reason);
  });
});

// Start server
const localPort = 4242;
server.listen(localPort, () => console.log(`Node server listening on port ${localPort}!`));