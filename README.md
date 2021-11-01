# Stripe Identity sample app

[Identity](https://stripe.com/docs/identity) is a prebuilt, hosted identity verification flow that can help you capture signals about individuals to make sure that they are who they claim to be. Identity can help you increase the trust and safety of your community, streamline risk operations to reduce losses, or launch verification as a new feature within your product.

**Demo**

See a [hosted version](https://identity.stripedemos.com/) of the sample app.

## How to run locally

This sample includes a Node server implementation. 

Follow the steps below to run locally.

**1. Clone the repository:**

```
git clone https://github.com/stripe-samples/identity-verification
```

**2. Copy the env.example to a .env file:**

Copy the env.example file into a file named .env in the project root folder. For example:

```
cp env.example .env
```

You will need a Stripe account in order to run the demo. Additionally, you will need to setup your account to use Identity, which you can do so [here](https://dashboard.stripe.com/identity/application). Once you set up your account, go to the Stripe [developer dashboard](https://stripe.com/docs/development#api-keys) to find your API keys. 

- Edit `.env` file with your text editor and update your `.env` file with the keys.

```
STRIPE_SECRET_KEY=<replace-with-your-test-secret-key>
STRIPE_PUBLISHABLE_KEY=<replace-with-your-test-publishable-key>
```

`STATIC_DIR` tells the server where to the client files are located and does not need to be modified unless you move the server files.

**3. Install and run:**
```
cd src/
npm install
npm start
```


## FAQ
Q: Why did you pick these frameworks?

A: We chose the most minimal framework to convey the key Stripe calls and concepts you need to understand. These demos are meant as an educational tool that helps you roadmap how to integrate Stripe within your own system independent of the framework.


## Get support
If you found a bug or want to suggest a new [feature/use case/sample], please [file an issue](../../issues).

If you have questions, comments, or need help with code, we're here to help:
- on [IRC via freenode](https://webchat.freenode.net/?channel=#stripe)
- on Twitter at [@StripeDev](https://twitter.com/StripeDev)
- on Stack Overflow at the [stripe-payments](https://stackoverflow.com/tags/stripe-payments/info) tag
- by [email](mailto:support+github@stripe.com)

Sign up to [stay updated with developer news](https://go.stripe.global/dev-digest).


## Author(s)
[@bz-stripe](https://twitter.com/atav32)
