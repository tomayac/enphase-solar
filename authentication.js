import fetch from 'node-fetch';
import { USER, PASSWORD, ENVOY_SERIAL } from './index.js';

async function getToken() {
  const loginResponse = await fetch(
    'https://enlighten.enphaseenergy.com/login/login.json?',
    {
      method: 'POST',
      body: `user[email]=${USER}&user[password]=${PASSWORD}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
  );

  const loginResponseData = await loginResponse.json();

  const tokenData = {
    session_id: loginResponseData.session_id,
    serial_num: ENVOY_SERIAL,
    username: USER,
  };

  const tokenResponse = await fetch('https://entrez.enphaseenergy.com/tokens', {
    method: 'POST',
    body: JSON.stringify(tokenData),
    headers: { 'Content-Type': 'application/json' },
  });

  const webToken = await tokenResponse.text();
  return webToken;
}

export { getToken };
