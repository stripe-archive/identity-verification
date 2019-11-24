const verificationIntentId = sessionStorage.getItem(window.stripeSample.VI_STORAGE_KEY);

const updateResponseContainer = (response) => {
  const responseContainer = document.querySelector('#response');
  let responseText = response;
  if (typeof response !== 'string') {
    responseText = JSON.stringify(response, null, 2);
  }
  responseContainer.textContent = responseText;
}

const updateHeader = (status) => {
  const header = document.querySelector('h4.header');
  header.textContent = status.replace(/_/g, ' ');
}

const handleDataResponse = (data) => {
  updateResponseContainer(data);
  updateHeader(data.status);
  if (data.status === 'requires_action') {
    const tryAgainButton = document.querySelector('#try-again');
    tryAgainButton.classList.remove('hidden');
  }
}

if (verificationIntentId) {
  const socket = io();

  socket.on('connect', () => {
    console.log('%c socket:connect', 'color: #b0b');
    socket.emit('init', {
      verificationIntentId: verificationIntentId,
    });
  });

  socket.on('acknowledge', (data) => {
    console.log('%c socket:acknowledge', 'color: #b0b');
    handleDataResponse(data);
  });

  socket.on('exception', (error) => {
    console.log('%c socket:error', 'color: #b0b', error);
    if (error.errorCode === 'VERIFICATION_INTENT_INTENT_NOT_FOUND') {
      updateResponseContainer('Oops, the server could not find a recent verification. Please start over.');
      updateHeader('Error');
    }
  });

  socket.on('verification_result', (data) => {
    console.log('%c socket:result', 'color: #b0b', data);
    handleDataResponse(data);
  });
} else {
  updateResponseContainer('Oops, could not find a recent verification. Please start over.');
  updateHeader('Error');
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
