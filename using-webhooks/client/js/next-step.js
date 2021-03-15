/*
 * Hide a DOM element
 */
var hide = function(element) {
  if (element) {
    element.classList.add('hide');
  }
}

/*
 * Show a DOM element
 */
var unhide = function(element) {
  if (element && element.classList.contains('hidden')) {
    element.classList.remove('hidden');
    element.classList.add('unhide');
  }
}

/*
 * Update the h4 with the VerificationSession status
 */
var updateHeader = function(newStatus) {
  var currentStatus = sessionStorage.getItem('vi_status') || '';
  sessionStorage.setItem('vi_status', newStatus);

  var header = document.querySelector('.status-text');
  header.textContent = newStatus.replace(/_/g, ' ');

  var statusIcon = document.querySelector('.status-icon');
  statusIcon.style.backgroundImage = `url('../media/Icon--${newStatus}.svg')`;

  if (currentStatus) {
    header.classList.remove(currentStatus);
  }
  header.classList.add(newStatus);
}

/*
 * Show a message to the user
 */
var updateMessage = function(message) {
  unhide(document.getElementById('response'));

  var responseContainer = document.getElementById('response');
  responseContainer.textContent = message;
}

var urlParams = new URLSearchParams(window.location.search);
var verificationSessionId = urlParams.get('verification_session_id');



if (verificationSessionId) {
  var socket = io();

  // websocket event when a new connection or a re-connect
  socket.on('connect', function() {
    console.log('%c socket:connect', 'color: #b0b');
    socket.emit('init', {
      verificationSessionId: verificationSessionId,
    });
  });

  // websocket event when the server sends a message
  socket.on('acknowledge', function(status) {
    console.log('%c socket:acknowledge', 'color: #b0b', status);
    updateHeader(status);
  });

  // websocket event when the server sends an error
  socket.on('exception', function(error) {
    console.log('%c socket:error', 'color: #b0b', error);
    if (error.errorCode === 'VERIFICATION_SESSION_NOT_FOUND') {
      updateMessage('Oops, the server could not find a recent verification.\n\nPlease start over.');
      updateHeader('error');
    }
  });

  // websocket event when the server sends the first VerificationSession result
  // TODO remove this case to simplify logic
  socket.on('verification_result', function(status) {
    console.log('%c socket:result', 'color: #b0b', status);
    updateHeader(status)
  });
} else {
  updateMessage('Oops, could not find a recent verification.\n\nPlease start over.');
  updateHeader('error');
  console.log('Could not find an existing verification.');
}

// Show a message in case a verification is pending
if (document.location.search.includes('existing-verification')) {
  var titleContainer = document.querySelector('.sr-verification-summary');
  var message = document.createElement('h4');

  if (verificationSessionId) {
    message.textContent = 'A verification is already in progress';
  } else {
    message.textContent = 'Oops, something went wrong. Please start over.';
  }
  titleContainer.appendChild(message);
}
