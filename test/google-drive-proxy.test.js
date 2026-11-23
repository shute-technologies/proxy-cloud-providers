// Runs against the compiled output (npm test builds first), so it checks what gets published.
const test = require('node:test');
const assert = require('node:assert/strict');

// Stand-ins for Google's `gapi` loader and the Google Identity Services token client. Touching
// `gapi.auth2`, or loading it, fails the test.
function installFakeGoogle() {
  const calls = { load: [], init: [], setToken: [], aboutGet: 0, requestAccessToken: [], revoke: [] };
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

  const tokenClient = {
    callback: null,
    requestAccessToken(params) { calls.requestAccessToken.push(params); }
  };
  const google = {
    accounts: {
      oauth2: {
        initTokenClient(params) { calls.tokenClientParams = params; return tokenClient; },
        revoke(accessToken, done) { calls.revoke.push(accessToken); if (done) { done(); } }
      }
    }
  };

  global.gapi = gapi;
  global.google = google;
  // What Google's token client does once the user has picked an account.
  const grant = (accessToken) => tokenClient.callback({ access_token: accessToken });
  return { calls, grant };
}

const { GoogleDriveProxy } = require('../lib/index.js');
const flush = () => new Promise((resolve) => setImmediate(resolve));
const DISCOVERY = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

async function loadedProxy() {
  const fake = installFakeGoogle();
  const proxy = new GoogleDriveProxy('client-id', 'api-key', 'drive.file', DISCOVERY);
  const signedIn = [];
  proxy.callbackOnSignedIn = (value) => signedIn.push(value);
  proxy.loadClient();
  await flush();
  return { proxy, signedIn, ...fake };
}

test('loadClient loads gapi `client` only, never `auth2`', async () => {
  const { calls } = await loadedProxy();

  assert.deepEqual(calls.load, ['client']);
});

test('gapi.client.init gets the discovery docs and API key only (clientId/scope would initialise auth2)', async () => {
  const { calls } = await loadedProxy();

  assert.deepEqual(calls.init, [{ discoveryDocs: DISCOVERY, apiKey: 'api-key' }]);
  // The scopes go to the token client instead.
  assert.equal(calls.tokenClientParams.scope, 'drive.file');
  assert.equal(calls.tokenClientParams.client_id, 'client-id');
});

test('the token client is asked for consent the first time, and its token signs in once', async () => {
  const { calls, grant, signedIn } = await loadedProxy();

  assert.deepEqual(calls.requestAccessToken, [{ prompt: 'consent' }]);

  await grant('token-1');
  assert.deepEqual(calls.setToken, [{ access_token: 'token-1' }]);
  assert.deepEqual(signedIn, [true]);
  assert.equal(calls.aboutGet, 1);

  // A renewed token is handed over without signing in again.
  await grant('token-2');
  assert.deepEqual(calls.setToken.at(-1), { access_token: 'token-2' });
  assert.deepEqual(signedIn, [true]);
  assert.equal(calls.aboutGet, 1);
});

test('signIn asks the token client, without auth2', async () => {
  const { proxy, calls } = await loadedProxy();
  calls.requestAccessToken.length = 0;

  assert.doesNotThrow(() => proxy.signIn());

  assert.deepEqual(calls.requestAccessToken, [{ prompt: '' }]);
});

test('signOut revokes the token and clears it, without auth2', async () => {
  const { proxy, calls, grant, signedIn } = await loadedProxy();
  await grant('token-1');

  assert.doesNotThrow(() => proxy.signOut());

  assert.deepEqual(calls.revoke, ['token-1']);
  assert.equal(calls.setToken.at(-1), null);
  assert.deepEqual(signedIn, [true, false]);
  assert.equal(proxy.isSignedIn, false);
});

test('setAccessToken lets a host page that signs in itself hand the token over', async () => {
  const { proxy, calls, signedIn } = await loadedProxy();

  proxy.setAccessToken('host-token');

  assert.deepEqual(calls.setToken.at(-1), { access_token: 'host-token' });
  assert.deepEqual(signedIn, [true]);
});

test('finished requests are cleared before sign-in, without a "You must signIn" warning', async () => {
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args.join(' '));
  try {
    await loadedProxy();
  } finally {
    console.warn = originalWarn;
  }

  assert.deepEqual(warnings.filter((w) => w.includes('You must signIn')), []);
});
