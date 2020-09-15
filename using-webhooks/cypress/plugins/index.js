// @flow

// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

const fetch = require('node-fetch');

module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config

  on('before:browser:launch', (browser = {}, launchOptions) => {
    // `args` is an array of all the arguments that will
    // be passed to browsers when it launches
    console.log(launchOptions.args) // print all current args

    if (browser.family === 'chromium' && browser.name !== 'electron') {
      // auto open devtools
      launchOptions.args.push('--auto-open-devtools-for-tabs')

      // whatever you return here becomes the launchOptions
      return launchOptions
    }

    if (browser.family === 'firefox') {
      // auto open devtools
      launchOptions.args.push('-devtools')

      return launchOptions
    }
  })

  on('task', {
    async getDemoStartLink() {
      const headers = new fetch.Headers();
      headers.set('Content-Type', 'application/json');
      headers.set('Origin', 'http://example.com');

      const response = await fetch(
        'https://khw77.sse.codesandbox.io/create-verification-intent',
        {
          method: 'POST',
          headers,
        },
      );
      const responseJson = await response.json();
      if (responseJson && responseJson.next_action) {
        return responseJson.next_action.redirect_to_url;
      } else {
        console.error(responseJson);
        return 'https://stripe.com';
      }
    },
  });
};
