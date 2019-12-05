/*
 * Calls the server to retrieve the identity verification start url
 */
const startIdentityVerification = () => {
  fetch("/create-verification-intent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
  }).then(function(result) {
    return result.json();
  }).then(function(data) {
    console.log('%c data', 'color: #b0b', data);
    if (data.id) {
      if (data && data.next_action && data.next_action.redirect_to_url) {
        // redirect the user to the verification flow
        document.location.href = data.next_action.redirect_to_url;
      }
    }
  });
}

const startButton = document.querySelector('#create-verification-intent');
startButton.addEventListener('click', startIdentityVerification);
