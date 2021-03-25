const uuid = require('uuid/v4');
const MockDate = require('mockdate');
const Store = require('../server/store.js');

describe('Store tests', () => {
  beforeEach(() => {
    MockDate.set('1999-12-31');
  });

  afterEach(() => {
    MockDate.reset();
  });

  it('initializes store to empty object', () => {
    const testStore = new Store();
    expect(testStore.store).toEqual({});
  });

  it('initializes store to initial object', () => {
    const testStore = new Store({a: 1, b: 2, c: 3});
    expect(testStore.store).toEqual({a: 1, b: 2, c: 3});
  });

  it('non-existent id', () => {
    const testStore = new Store();
    const id = uuid();
    expect(() => {
      testStore.getDoc(id);
    }).toThrow();
    expect(() => {
      testStore.getStaticValue(id, 'a');
    }).toThrow();
  });

  it('getLatestValue', () => {
    const testStore = new Store();
    const id = uuid();
    expect(() => {
      testStore.getLatestValue(id);
    }).toThrow();
    testStore.upsert(id, {a: 1})
    expect(testStore.getLatestValue(id)).toEqual({a: 1, expires: Date.now() + testStore.getBackoff()});
    testStore.upsert(id, {b: 2})
    expect(testStore.getLatestValue(id)).toEqual({b: 2, expires: Date.now() + 2 * testStore.getBackoff()});
    testStore.upsert(id, {c: 3})
    expect(testStore.getLatestValue(id)).toEqual({c: 3, expires: Date.now() + 3 * testStore.getBackoff()});
  });

  it('getStaticValue', () => {
    const testStore = new Store();
    const id = uuid();
    testStore.setStaticValue(id, 'a', 1)
    const staticValue = testStore.getStaticValue(id, 'a');
    expect(staticValue).toBe(1);
  });

  it('non-existent static key', () => {
    const testStore = new Store();
    const id = uuid();
    testStore.setStaticValue(id, 'a', 1)
    expect(() => {
      testStore.getStaticValue(id, 'b');
    }).toThrow();
  });

  it('setBackoff', () => {
    const testStore = new Store();
    expect(() => {
      testStore.setBackoff();
    }).toThrow();
    expect(() => {
      testStore.setBackoff(null);
    }).toThrow();
    expect(() => {
      testStore.setBackoff('abc');
    }).toThrow();
    expect(() => {
      testStore.setBackoff({a: 1});
    }).toThrow();
    expect(() => {
      testStore.setBackoff(-1);
    }).toThrow();
    testStore.setBackoff(1000);
    expect(testStore.getBackoff()).toBe(1000);
  });

  it('setStaticValue', () => {
    const testStore = new Store();
    const id = uuid();
    testStore.setStaticValue(id, 'a', 1)
    expect(testStore.store).toEqual({[id]: {a: 1}});
    testStore.setStaticValue(id, 'a', {b: 2})
    expect(testStore.store).toEqual({[id]: {a: {b: 2}}});
  });

  it('upsert', () => {
    const testStore = new Store();
    const id = uuid();
    testStore.upsert(id, {a: 1})
    expect(testStore.getDoc(id)).toEqual({items: [{a: 1, expires: Date.now() + testStore.getBackoff()}]});
    expect(testStore.store).toEqual({[id]: {items: [{a: 1, expires: Date.now() + testStore.getBackoff()}]}});
  });

  it('upsert expiration is valid datetime', () => {
    const testStore = new Store();
    const id = uuid();
    const offset = 1000;
    expect(() => {
      testStore.upsert(id, {a: 1}, 'abc')
    }).toThrow();
    testStore.upsert(id, {a: 1}, Date.now() + offset)
    expect(testStore.store).toEqual({[id]: {items: [{a: 1, expires: Date.now() + offset}]}});
  });

  it('delete', () => {
    const testStore = new Store();
    const id = uuid();
    expect(() => {
      testStore.delete(id);
    }).toThrow();
    testStore.upsert(id, {a: 1})
    expect(testStore.getDoc(id)).toEqual({items: [{a: 1, expires: Date.now() + testStore.getBackoff()}]});
    testStore.delete(id);
    expect(() => {
      testStore.getDoc(id);
    }).toThrow();
    testStore.upsert(id, {b: 2})
    expect(testStore.getDoc(id)).toEqual({items: [{b: 2, expires: Date.now() + testStore.getBackoff()}]});
  });

  it('deleteStaticValue', () => {
    const testStore = new Store();
    const id = uuid();
    expect(() => {
      testStore.deleteStaticValue(id);
    }).toThrow();
    testStore.setStaticValue(id, 'a', 1)
    expect(testStore.store).toEqual({[id]: {a: 1}});
    testStore.deleteStaticValue(id);
    expect(testStore.store).toEqual({});
  });

  it('deleteValues', () => {
    const testStore = new Store();
    const id = uuid();
    expect(() => {
      testStore.deleteValues(id);
    }).toThrow();
    testStore.upsert(id, {a: 1})
    expect(testStore.getLatestValue(id)).toEqual({a: 1, expires: Date.now() + testStore.getBackoff()});
    testStore.upsert(id, {b: 2})
    expect(testStore.getLatestValue(id)).toEqual({b: 2, expires: Date.now() + 2 * testStore.getBackoff()});
    testStore.upsert(id, {c: 3})
    expect(testStore.getLatestValue(id)).toEqual({c: 3, expires: Date.now() + 3 * testStore.getBackoff()});
    testStore.deleteValues(id);
    expect(() => {
      expect(testStore.getLatestValue(id)).toEqual(undefined);
    }).toThrow();
    testStore.upsert(id, {d: 4})
    expect(testStore.getLatestValue(id)).toEqual({d: 4, expires: Date.now() + testStore.getBackoff()});
  });

  it('shouldUpdateValue', () => {
    const testStore = new Store();
    const id = uuid();
    expect(() => {
      testStore.shouldUpdateValue(id);
    }).toThrow();
    testStore.upsert(id, {a: 1})
    expect(testStore.shouldUpdateValue(id)).toBe(false);
    MockDate.set('2000-01-01');
    expect(testStore.shouldUpdateValue(id)).toBe(true);
    expect(() => {
      testStore.shouldUpdateValue(id, true);
    }).toThrow();
    expect(testStore.shouldUpdateValue(id, (() => true))).toBe(true);
    expect(testStore.shouldUpdateValue(id, (() => false))).toBe(false);
    testStore.deleteValues(id);
    expect(testStore.shouldUpdateValue(id)).toBe(true);
    testStore.delete(id);
    expect(() => {
      testStore.shouldUpdateValue(id);
    }).toThrow();
  });
});
