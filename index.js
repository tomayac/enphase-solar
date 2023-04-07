import EventSource from 'eventsource';
import { getToken } from './authentication.js';
import fetch from 'node-fetch';

const LOCAL_IP = '192.168.86.211';
const USER = 'steiner.thomas@gmail.com';
const PASSWORD = 'LtP=17141!';
const ENVOY_SERIAL = '122232075621';

/*
const eventSource = new EventSource(
  `https://${LOCAL_IP}/stream/meter`
);

eventSource.addEventListener('error', (e) => {
  console.error('error', e);
});

eventSource.addEventListener('open', (e) => {
  console.log('open', e);
});

eventSource.addEventListener('message', (e) => {
  console.log('message', JSON.parse(e.data));
});
*/

export { USER, PASSWORD, ENVOY_SERIAL, LOCAL_IP };
