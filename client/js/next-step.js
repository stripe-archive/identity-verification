const verificationIntentId = sessionStorage.getItem(window.stripeSample.VI_STORAGE_KEY);
let cancelProgress;

/*
 * Set increasing longer timeouts
 */
const easingTimeout = (delay, fn) => {
  let id;
  const invoker = () => {
    delay = Math.round(delay + 1);
    if (delay) {
      id = setTimeout(invoker, delay);
    } else {
      id = null;
    }
    fn();
  };
  id = setTimeout(invoker, delay);
  return (() => {
    if (id) {
      clearTimeout(id);
      id = null;
    }
  });
};

/*
 * Gradually slow down the progress bar
 */
const advanceProgress = () => {
  let progressValue = parseFloat(sessionStorage.getItem('progress')) || 1.0;
  progressValue += Math.random() * 0.4; // slightly randomize the progress
  if (progressValue >= 98) {
    cancelProgress();
    progressValue = 98;
  }
  const progressBar = document.querySelector('#progress');
  progressBar.style.width = `${progressValue}%`;
  sessionStorage.setItem('progress', progressValue);
};

/*
 * Show the VerificationIntent response JSON
 */
const updateResponseContainer = (response) => {
  if (response.status !== 'processing') {
    const responseContainer = document.querySelector('#response');
    let responseText = response;
    if (typeof response !== 'string') {
      responseText = JSON.stringify(response, null, 2);
    }
    responseContainer.textContent = responseText;
  } else {
    cancelProgress = easingTimeout(1, advanceProgress);
  }
}

/*
 * Update the h4 with the VerificationIntent status
 */
const updateHeader = (status) => {
  const header = document.querySelector('h4.header');
  header.textContent = status.replace(/_/g, ' ');
}

/*
 * Handler for when the API returns a data response
 */
const handleDataResponse = (data) => {
  updateResponseContainer(data);
  updateHeader(data.status);
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
