let pollingInterval = 1000;
const urlParams = new URLSearchParams(window.location.search);
const verificationIntentId = urlParams.get('verification_intent_id');

/*
 * Hide a DOM element
 */
const hide = function(element) {
  if (element) {
    element.classList.add('hide');
  }
}

/*
 * Show a DOM element
 */
const unhide = function(element) {
  if (element && element.classList.contains('hidden')) {
    element.classList.remove('hidden');
    element.classList.add('unhide');
  }
}

/*
 * Update the h4 with the VerificationIntent status
 */
const updateHeader = function(status) {
  const header = document.querySelector('.status-text');
  header.textContent = status.replace(/_/g, ' ');

  const statusIcon = document.querySelector('.status-icon');
  statusIcon.style.backgroundImage = `url('../media/Icon--${status}.svg')`;
}

/*
 * Show a message to the user
 */
const updateMessage = function(message) {
  unhide(document.getElementById('response'));

  const responseContainer = document.getElementById('response');
  responseContainer.textContent = message;
}

const calculateBackoff = function(interval) {
  const maxInterval = 60000;
  const backoffRate = 1.5;
  if (interval < maxInterval) {
    return parseInt(interval * backoffRate, 10);
  }
  return interval;
}

const getVerificationIntent = function(verificationIntentId) {
  return fetch(`/get-verification-intent/${verificationIntentId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    },
  }).then(function(result) {
    return result.json();
  }).then(function(data) {
    console.log('%c get VerificationIntent', 'color: #b0b', data);
    if (data && data.status) {
      updateHeader(data.status)

      // If the verification is still processing, poll every second
      if (data.status === 'processing') {
        window.setTimeout(() => {
          getVerificationIntent(verificationIntentId);
          pollingInterval = calculateBackoff(pollingInterval);
          console.log('%c polling interval', 'color: #b0b', pollingInterval);
        }, pollingInterval);
      }
    } else {
      updateHeader('error');
    }
  });
}

getVerificationIntent(verificationIntentId);
