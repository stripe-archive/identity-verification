const hide = (element) => {
  if (element) {
    element.classList.add('hide');
  }
}

const unhide = (element) => {
  if (element && element.classList.contains('hidden')) {
    element.classList.remove('hidden');
    element.classList.add('unhide');
  }
}

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
let cancelProgress;
const advanceProgress = () => {
  let progressValue = parseFloat(sessionStorage.getItem('progress')) || 5.0;
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
    unhide(document.querySelector('#response'));
    hide(document.querySelector('.progress-bar'));

    const responseJson = document.querySelector('.response-json');
    responseJson.classList.add(response.status);

    const responseContainer = document.querySelector('#response');
    let responseText = response;
    if (typeof response !== 'string') {
      responseText = JSON.stringify(response, null, 2);
    }
    responseContainer.textContent = responseText;
  } else {
    unhide(document.querySelector('.progress-bar'));
    cancelProgress = easingTimeout(1, advanceProgress);
  }
}

/*
 * Update the h4 with the VerificationIntent status
 */
const updateHeader = (newStatus) => {
  const currentStatus = sessionStorage.getItem('vi_status') || '';
  sessionStorage.setItem('vi_status', newStatus);

  const header = document.querySelector('.status-text');
  header.textContent = newStatus.replace(/_/g, ' ');

  const statusIcon = document.querySelector('.status-icon');
  statusIcon.style.backgroundImage = `url('../media/Icon--${newStatus}.svg')`;

  if (currentStatus) {
    header.classList.remove(currentStatus);
  }
  header.classList.add(newStatus);
}

/*
 * Handler for when the API returns a data response
 */
const handleDataResponse = (data) => {
  updateResponseContainer(data);
  updateHeader(data.status);
}



const urlParams = new URLSearchParams(window.location.search);
const verificationIntentId = urlParams.get('verification_intent_id');

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
      updateHeader('error');
    }
  });

  socket.on('verification_result', (data) => {
    console.log('%c socket:result', 'color: #b0b', data);
    handleDataResponse(data);
  });
} else {
  updateResponseContainer('Oops, could not find a recent verification. Please start over.');
  updateHeader('error');
  console.log('Could not find an existing verification.');
}

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
