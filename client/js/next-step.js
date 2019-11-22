const verificationIntentId = sessionStorage.getItem(window.stripeSample.VI_STORAGE_KEY);
const responseContainer = document.querySelector('#response');

if (verificationIntentId) {
  const socket = io();

  socket.on('connect', () => {
    console.log('%c socket:connect', 'color: #b0b');
    socket.emit('init', {
      verificationIntentId: verificationIntentId,
    });
  });

  socket.on('acknowledge', () => {
    console.log('%c socket:acknowledge', 'color: #b0b');
  });

  socket.on('exception', (error) => {
    console.log('%c socket:error', 'color: #b0b', error);
    if (error.errorCode === 'VERIFICATION_INTENT_INTENT_NOT_FOUND') {
      responseContainer.textContent = 'Oops, the server could not find a recent verification. Please start over.'
    }
  });

  socket.on('verification_result', (data) => {
    console.log('%c socket:result', 'color: #b0b', data);
    if (data.status === 'succeeded') {
      responseContainer.textContent = JSON.stringify(data, null, 2);
    }
  });
} else {
  responseContainer.textContent = 'Oops, could not find a recent verification. Please start over.'
  console.log('Could not find an existing verification.');
}

const startOverButton = document.querySelector('#start-over');
startOverButton.addEventListener('click', () => {
  sessionStorage.removeItem(window.stripeSample.VI_STORAGE_KEY);
  document.location.href = '/';
});

// Show message in case a verification is pending
if (document.location.search.includes('existing-verification')) {
  const titleContainer = document.querySelector('.sr-verification-summary');
  const message = document.createElement('h4');

  if (verificationIntentId) {
    message.textContent = 'A verification is already in progress';
  } else {
    message.textContent = 'Oops, something went wrong. Please start over.';
  }
  titleContainer.appendChild(message);
}
