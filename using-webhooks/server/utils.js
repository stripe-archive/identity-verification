const shouldGetUpdatedVerification = (latestVerification) => (
  !latestVerification ||
  latestVerification.status !== 'succeeded' &&
  latestVerification.status !== 'canceled' &&
  !latestVerification.error
);
exports.shouldGetUpdatedVerification = shouldGetUpdatedVerification;

