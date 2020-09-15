/*
 * Calls the server to retrieve the identity verification start url
 */
var startIdentityVerification = function() {
  return fetch("/create-verification-intent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
  }).then(function(result) {
    return result.json();
  }).then(function(data) {
    if (data && data.id && data.next_action && data.next_action.redirect_to_url) {
      return data.next_action.redirect_to_url;
    }
  });
}

var openIframe = function(url) {
  console.log('%c openIframe', 'color: #b0b', url);
}

var startButton = document.getElementById('create-verification-intent');
startButton.addEventListener('click', function() {
  startIdentityVerification().then(function(url) {
    openIframe(url);
  });
});

var newPageLink = document.getElementById('create-verification-intent-new-page');
newPageLink.addEventListener('click', function() {
  startIdentityVerification().then(function(url) {
    // redirect the user to the verification flow
    window.open(url, '_blank');
  });
});
