import fetch from 'node-fetch';
import { USERNAME, PASSWORD, ENVOY_SERIAL } from './index.js';

const ENPHASE_LOGIN_URL =
  'https://enlighten.enphaseenergy.com/login/login.json';
const ENPHASE_TOKEN_URL = 'https://entrez.enphaseenergy.com/tokens';

async function getToken() {
  const loginResponse = await fetch(ENPHASE_LOGIN_URL, {
    method: 'POST',
    body: `user[email]=${USERNAME}&user[password]=${PASSWORD}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const loginResponseData = await loginResponse.json();

  const tokenData = {
    session_id: loginResponseData.session_id,
    serial_num: ENVOY_SERIAL,
    username: USERNAME,
  };

  const tokenResponse = await fetch(ENPHASE_TOKEN_URL, {
    method: 'POST',
    body: JSON.stringify(tokenData),
    headers: { 'Content-Type': 'application/json' },
  });

  const webToken = await tokenResponse.text();
  return webToken;
}

export { getToken };
