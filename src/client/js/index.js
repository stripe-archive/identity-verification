const stripe = Stripe(window.STRIPE_PUBLISHABLE_KEY, {
  betas: ['identity_dialog_1'],
});

/*
 * Calls the server to retrieve the identity verification client secret for Stripe.js
 */

const startIdentityVerification = function() {
  if (startButton) {
    startButton.disabled = true;
  }

  fetch("/create-verification-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
  }).then(function(result) {
    return result.json();
  }).then(function(response) {
    // console.log(response);
    if (response.error) {
      throw response.error;
    } else {
      // Show the verification modal.
      sessionStorage.setItem('verification_session_id', response.session.id);
      return stripe.verifyIdentity(response.session.client_secret);
    }
  }).then(function(result) {
    // If `verifyIdentity` fails, you should display the localized
    // error message to your user using `error.message`.
    if (result.error) {
      console.error('Error:', result.error);
      sessionStorage.setItem('verification_session_error', JSON.stringify(result.error));
    }
    window.location.href = '/next-step';
  }).catch(function(error) {
    console.error('Error:', error);
    const errorMessageContainer = document.querySelector('.error-message');
    if (errorMessageContainer) {
      errorMessageContainer.classList.remove('hidden');
    }
  }).finally(function() {
    if (startButton) {
      startButton.disabled = false;
    }
  });
}

const startButton = document.querySelector('#create-verification-session');
startButton.addEventListener('click', startIdentityVerification);


/*
 * Calls the server to retrieve the identity verification start url
 */
const addRedirectToIdentityVerification = function() {
  return fetch("/create-verification-session-redirect", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
  }).then(function(result) {
    return result.json();
  }).then(function(data) {
    if (data && data.session && data.session.id && data.session.url) {
      sessionStorage.setItem('verification_session_id', data.session.id);
      const newPageLink = document.querySelector('#create-verification-session-new-tab');
      newPageLink.href = data.session.url;
    }
  }).catch(function(error) {
    console.error('Error:', error);
  });
}

addRedirectToIdentityVerification()