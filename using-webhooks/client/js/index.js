/*
 * Calls the server to retrieve the identity verification start url
 */
var startIdentityVerification = function() {
  fetch("/create-verification-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
  }).then(function(result) {
    return result.json();
  }).then(function(data) {
    if (data.id) {
      if (data && data.next_action && data.next_action.redirect_to_url) {
        // redirect the user to the verification flow
        document.location.href = data.next_action.redirect_to_url;
      }
    }
  });
}

var startButton = document.getElementById('create-verification-session');
startButton.addEventListener('click', startIdentityVerification);
