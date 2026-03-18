const crypto = require('crypto');

function hash(password, rounds = 10) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, { N: 2 ** Math.min(Math.max(rounds, 1), 14) }, (err, derivedKey) => {
      if (err) {
        return reject(err);
      }
      resolve(`$localbcrypt$${rounds}$${salt}$${derivedKey.toString('hex')}`);
    });
  });
}

function compare(password, hashed) {
  return new Promise((resolve, reject) => {
    try {
      const [, marker, rounds, salt, key] = hashed.split('$');
      if (marker !== 'localbcrypt') {
        return resolve(false);
      }

      crypto.scrypt(password, salt, 64, { N: 2 ** Math.min(Math.max(Number(rounds), 1), 14) }, (err, derivedKey) => {
        if (err) {
          return reject(err);
        }
        const hashedBuffer = Buffer.from(key, 'hex');
        const derivedBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');
        if (hashedBuffer.length !== derivedBuffer.length) {
          return resolve(false);
        }
        resolve(crypto.timingSafeEqual(hashedBuffer, derivedBuffer));
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  hash,
  compare
};
