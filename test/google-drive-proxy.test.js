// Runs against the compiled output (npm test builds first), so it checks what gets published.
const test = require('node:test');
const assert = require('node:assert/strict');

// A stand-in for Google's `gapi` loader. Touching `gapi.auth2`, or loading it, fails the test.
function installFakeGapi() {
  const calls = { load: [], init: [], setToken: [], aboutGet: 0 };
  let token = null;

  const gapi = {
    load(name, callbackOrConfig) {
      calls.load.push(name);
      const callback = typeof callbackOrConfig === 'function' ? callbackOrConfig : callbackOrConfig.callback;
      callback();
    },
    client: {
      init(args) { calls.init.push(args); return Promise.resolve(); },
      setToken(value) { calls.setToken.push(value); token = value; },
      getToken() { return token; },
      drive: {
        about: {
          get() {
            calls.aboutGet++;
            return { execute: (callback) => callback({ user: { displayName: 'Test' }, storageQuota: { limit: '1' } }) };
          }
        }
      }
    }
  };
  Object.defineProperty(gapi, 'auth2', { get() { throw new Error('gapi.auth2 was accessed'); } });

  global.gapi = gapi;
  return calls;
}

const { GoogleDriveProxy } = require('../lib/index.js');
const flush = () => new Promise((resolve) => setImmediate(resolve));

test('the constructor loads gapi `client` only, never `auth2`', async () => {
  const calls = installFakeGapi();
  new GoogleDriveProxy();
  await flush();

  assert.deepEqual(calls.load, ['client']);
});

test('gapi.client.init gets discovery docs only (clientId/scope would initialise auth2)', async () => {
  const calls = installFakeGapi();
  new GoogleDriveProxy();
  await flush();

  assert.equal(calls.init.length, 1);
  assert.deepEqual(Object.keys(calls.init[0]), ['discoveryDocs']);
});

test('setAccessToken(token) sets the gapi token, signs in once, and reports it', async () => {
  const calls = installFakeGapi();
  const proxy = new GoogleDriveProxy();
  const signedIn = [];
  proxy.callbackOnSignedIn = (value) => signedIn.push(value);
  await flush();

  proxy.setAccessToken('token-1');
  assert.deepEqual(calls.setToken, [{ access_token: 'token-1' }]);
  assert.deepEqual(signedIn, [true]);
  assert.equal(calls.aboutGet, 1);

  // A renewed token is handed over without signing in again.
  proxy.setAccessToken('token-2');
  assert.deepEqual(calls.setToken.at(-1), { access_token: 'token-2' });
  assert.deepEqual(signedIn, [true]);
  assert.equal(calls.aboutGet, 1);
});

test('updateSignInStatus(true) still works for hosts that set the gapi token themselves', async () => {
  const calls = installFakeGapi();
  const proxy = new GoogleDriveProxy();
  const signedIn = [];
  proxy.callbackOnSignedIn = (value) => signedIn.push(value);
  await flush();

  global.gapi.client.setToken({ access_token: 'host-token' });
  proxy.updateSignInStatus(true);
  assert.deepEqual(signedIn, [true]);
  assert.equal(calls.aboutGet, 1);
});

test('signOut clears the token without auth2; signIn only warns', async () => {
  const calls = installFakeGapi();
  const proxy = new GoogleDriveProxy();
  const signedIn = [];
  proxy.callbackOnSignedIn = (value) => signedIn.push(value);
  await flush();

  assert.doesNotThrow(() => proxy.signIn());
  proxy.setAccessToken('token');
  assert.doesNotThrow(() => proxy.signOut());

  assert.equal(calls.setToken.at(-1), null);
  assert.deepEqual(signedIn, [true, false]);
});

test('finished requests are cleared before sign-in, without a "You must signIn" warning', async () => {
  installFakeGapi();
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args.join(' '));
  try {
    new GoogleDriveProxy();
    await flush();
  } finally {
    console.warn = originalWarn;
  }

  assert.deepEqual(warnings.filter((w) => w.includes('You must signIn')), []);
});
