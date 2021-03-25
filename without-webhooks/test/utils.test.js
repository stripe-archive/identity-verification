const shouldGetUpdatedVerification = require('../server/utils').shouldGetUpdatedVerification;

describe('utils', () => {
  it('shouldGetUpdatedVerification', () => {
    expect(shouldGetUpdatedVerification()).toBe(true);
    expect(shouldGetUpdatedVerification({status: 'succeeded'})).toBe(false);
    expect(shouldGetUpdatedVerification({status: 'canceled'})).toBe(false);
    expect(shouldGetUpdatedVerification({status: 'pending'})).toBe(true);
    expect(shouldGetUpdatedVerification({error: {type: 'invalid_request_error'}})).toBe(false);
  });
});
