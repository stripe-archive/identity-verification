/*
 * Calls the server to retrieve the identity verification start url
 */
const startIdentityVerification = () => {
  const verificationIntentId = sessionStorage.getItem(window.stripeSample.VI_STORAGE_KEY);

  if (verificationIntentId) {
    // if a verification is already in progress, go see the results
    document.location.href = '/next-step?existing-verification';
  } else {
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
        sessionStorage.setItem(window.stripeSample.VI_STORAGE_KEY, data.id);
        if (data && data.next_action && data.next_action.redirect_to_url) {
          // redirect the user to the verification flow
          document.location.href = data.next_action.redirect_to_url;
        }
      }
    });
  }
}

const startButton = document.querySelector('#create-verification-intent');
startButton.addEventListener('click', startIdentityVerification);





/*
 * Calls stripe.confirmCardPayment which creates a pop-up modal to
 * prompt the user to enter  extra authentication details without leaving your page
 */
var pay = function(stripe, card, clientSecret) {
  var cardholderName = document.querySelector("#name").value;

  var data = {
    card: card,
    billing_details: {}
  };

  if (cardholderName) {
    data["billing_details"]["name"] = cardholderName;
  }

  changeLoadingState(true);

  // Initiate the payment.
  // If authentication is required, confirmCardPayment will display a modal
  stripe
    .confirmCardPayment(clientSecret, { payment_method: data })
    .then(function(result) {
      if (result.error) {
        changeLoadingState(false);
        var errorMsg = document.querySelector(".sr-field-error");
        errorMsg.textContent = result.error.message;
        setTimeout(function() {
          errorMsg.textContent = "";
        }, 4000);
      } else {
        orderComplete(clientSecret);
      }
    });
};

/* ------- Post-payment helpers ------- */

/* Shows a success / error message when the payment is complete */
var orderComplete = function(clientSecret) {
  stripe.retrievePaymentIntent(clientSecret).then(function(result) {
    var paymentIntent = result.paymentIntent;
    var paymentIntentJson = JSON.stringify(paymentIntent, null, 2);
    document.querySelectorAll(".payment-view").forEach(function(view) {
      view.classList.add("hidden");
    });
    document.querySelectorAll(".completed-view").forEach(function(view) {
      view.classList.remove("hidden");
    });
    document.querySelector(".hold-status").textContent =
      paymentIntent.status === "requires_capture"
      ? "successfully placed"
      : "did not place";
    document.querySelector("pre").textContent = paymentIntentJson;
  });
};

// Show a spinner on payment submission
var changeLoadingState = function(isLoading) {
  if (isLoading) {
    document.querySelector("button").disabled = true;
    document.querySelector("#spinner").classList.remove("hidden");
    document.querySelector("#button-text").classList.add("hidden");
  } else {
    document.querySelector("button").disabled = false;
    document.querySelector("#spinner").classList.add("hidden");
    document.querySelector("#button-text").classList.remove("hidden");
  }
};
