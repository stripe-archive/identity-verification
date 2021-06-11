let pollingInterval = 1000;
const urlParams = new URLSearchParams(window.location.search);
const verificationSessionId = sessionStorage.getItem('verification_session_id');

/*
 * Update the h4 with the VerificationSession status
 */
const updateHeader = function(status) {
  const lastError = JSON.parse(sessionStorage.getItem('verification_session_error') || null);

  const title_header = document.querySelector('.status-title');
  title_header.textContent = "Your ride is not yet booked.";

  const header = document.querySelector('.status-text');
  let headerText = status.replace(/_/g, ' ');
  if (status === 'requires_input' && lastError && lastError.code) {
    headerText = lastError.code.replace(/_/g, ' ');
  }
  else if (status == "verified") {
    title_header.textContent = "Your ride is booked!";
    document.querySelector('.status-note').textContent = "For this demo, we will successfully verify everyone";
  }
  header.textContent = headerText;

  const statusIcon = document.querySelector('.status-icon');
  statusIcon.style.backgroundImage = `url('../media/Icon--${status}.svg')`;
}

const calculateBackoff = function(interval) {
  const maxInterval = 60000;
  const backoffRate = 1.5;
  if (interval < maxInterval) {
    return parseInt(interval * backoffRate, 10);
  }
  return interval;
}

const getVerificationSession = function(verificationSessionId) {
  return fetch(`/get-verification-session/${verificationSessionId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    },
  }).then(function(result) {
    return result.json();
  }).then(function(data) {
    // console.log('%c get VerificationSession', 'color: #b0b', data);
    if (data && data.session) {
      if (data.session.last_error) {
        updateHeader(data.session.last_error.code);
      } else {
        updateHeader(data.session.status)
      }

      // If the verification is still processing, poll every second
      if (data.session.status === 'processing') {
        window.setTimeout(() => {
          getVerificationSession(verificationSessionId);
          pollingInterval = calculateBackoff(pollingInterval);
          console.log('%c polling interval', 'color: #b0b', pollingInterval);
        }, pollingInterval);
      }
    } else {
      updateHeader('error');
    }
  });
}
getVerificationSession(verificationSessionId);

/*
 * Clear data from last verification
 */
const clearVerificationSession = function() {
  sessionStorage.removeItem('verification_session_id');
  sessionStorage.removeItem('verification_session_error');
  sessionStorage.removeItem('verification_session_status');
  window.location.href = '/';
};

const startOverButton = document.querySelector('#start-over');
startOverButton.addEventListener('click', clearVerificationSession);