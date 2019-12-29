class Store {
  constructor(initialStore = {}, backoff = 30000) {
    this.store = initialStore;
    this.backoff = backoff; // 30 secs
  }

  getBackoff() {
    return this.backoff;
  }

  getDoc(id) {
    if (this.store[id]) {
      return this.store[id];
    } else {
      throw Error(`Could not find ID: ${id}`);
    }
  }

  getStaticValue(id, key) {
    if (this.store[id]) {
      if (this.store[id][key]) {
        return this.store[id][key];
      } else {
        throw Error(`Could not find key: ${key} for ID: ${id}`);
      }
    } else {
      throw Error(`Could not find ID: ${id}`);
    }
  }

  getLatestValue(id) {
    const doc = this.getDoc(id);
    if (doc.items && doc.items.length) {
      return doc.items[0];
    } else {
      throw Error(`Could not find a value for ID: ${id}`);
    }
  }

  setBackoff(newBackoff) {
    if (newBackoff && !isNaN(newBackoff) && newBackoff > 0) {
      this.backoff = newBackoff;
    } else {
      throw Error('Please set backoff to a positive number');
    }
  }

  setStaticValue(id, key, value) {
    if (this.store[id]) {
      this.store[id][key] = value;
    } else {
      this.store[id] = {
        [key]: value,
      }
    }
  }

  upsert(id, value, expiration) {
    if (expiration !== undefined && isNaN(expiration)) {
      throw Error(`Please enter milliseconds since epoch for expiration: ${expiration}`)
    }
    let count = 0;
    const doc = this.store[id];
    if (doc) {
      const { items } = doc;
      count = (items && items.length) || 0;
    }
    const expires = expiration || (Date.now() + (count + 1) * this.backoff);
    const newValue = {
      ...value,
      expires,
    };
    if (doc) {
      if (doc.items) {
        doc.items.unshift(newValue);
      } else {
        doc.items = [newValue];
      }
    } else {
      this.store[id] = {
        items: [{
          ...value,
          expires,
        }],
      };
    }
  }

  delete(id) {
    const doc = this.getDoc(id);
    if (doc) {
      delete this.store[id];
    }
  }

  deleteStaticValue(id) {
    if (this.store[id]) {
      delete this.store[id];
    } else {
      throw Error(`Could not find a value for ID: ${id}`);
    }
  }

  deleteValues(id) {
    const doc = this.getDoc(id);
    if (doc) {
      delete doc.items;
    }
  }

  shouldUpdateValue(id, comparator) {
    if (comparator && typeof comparator !== 'function') {
      throw('comparator should be a function');
    }
    const doc = this.getDoc(id);
    if (doc.items && doc.items.length) {
      const latestValue = doc.items[0];
      if (latestValue && latestValue.expires < Date.now()) {
        if (comparator) {
          return comparator(latestValue);
        }
        return true;
      }
      return false;
    }
    return true;
  }
}

module.exports = Store;
