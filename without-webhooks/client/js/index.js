/*
 * Calls the server to retrieve the identity verification start url
 */
const startIdentityVerification = function() {
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

const iframeContainerTemplate = `
  <div class="modal-backdrop">
    <div class="stripe-identity-verification-iframe">
      <div class="iframe-header">
        <span class="iframe-title">Verify your identity</span>
        <img class="iframe-close" src="../media/cancel.svg">
      </div>
    </div>
  </div>
`;

const openIframe = function(url) {
  const iframePlaceholder = document.createElement('div');
  document.body.appendChild(iframePlaceholder);
  iframePlaceholder.outerHTML = iframeContainerTemplate;
  const iframeContainer = document.querySelector('.stripe-identity-verification-iframe');
  const iframe = document.createElement('iframe');
  iframe.setAttribute('allow', 'camera; microphone');
  iframe.src = url;
  iframeContainer.appendChild(iframe);
  return iframe;
};

const removeIframe = function() {
};

const startButton = document.getElementById('create-verification-intent');
startButton.addEventListener('click', function() {
  startIdentityVerification().then(function(url) {
    openIframe(url);
  });
});

const newPageLink = document.getElementById('create-verification-intent-new-page');
newPageLink.addEventListener('click', function() {
  startIdentityVerification().then(function(url) {
    // redirect the user to the verification flow
    window.open(url, '_blank');
  });
});
