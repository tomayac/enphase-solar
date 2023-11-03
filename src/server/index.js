import express from 'express';
import ViteExpress from 'vite-express';

import { getToken } from './authentication.js';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import SSE from '@gazdagandras/express-sse';

/*
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

const log = (...args) => console.log(...args);
const error = (...args) => console.error(...args);

const start = function (sqlite3) {
  log('Running SQLite3 version', sqlite3.version.libVersion);
  const db = new sqlite3.oo1.DB('/mydb.sqlite3', 'ct');
  // Your SQLite code here.
};

log('Loading and initializing SQLite3 module...');
sqlite3InitModule({
  print: log,
  printErr: error,
}).then((sqlite3) => {
  try {
    log('Done initializing. Running demo...');
    start(sqlite3);
  } catch (err) {
    error(err.name, err.message);
  }
});
*/

dotenv.config();
const { USER_NAME, PASSWORD, ENVOY_SERIAL, BASE_LOAD_WATTS, LOCAL_IP, PORT, HOST } = process.env;

const app = express();
const sse = new SSE();

app.use(express.static('public'));

app.get('/stream/meter', (req, res) => {
  sse.init(req, res);
});

const server = app.listen(PORT, HOST, () =>
  console.log(`Enphase Solar app listening on ${HOST}:${PORT}`),
);
ViteExpress.bind(app, server);

const token = await getToken();

const endpoints = {
  readings: '/ivp/meters/readings',
  // inverters: '/api/v1/production/inverters',
  // status: '/ivp/livedata/status',
  // consumption: '/ivp/meters/reports/consumption',
};

const interval = setInterval(async () => {
  const promises = [];
  for (const endpoint of Object.values(endpoints)) {
    const url = `https://${LOCAL_IP}${endpoint}`;
    promises.push(
      fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((response) => {
        if (!response.ok || response.status !== 200) {
          throw new Error(
            `Error fetching ${url}: ${response.status}: ${response.statusText}`,
          );
        }
        return response.json();
      }),
    );
  }
  try {
    const data = await Promise.all(promises);
    const results = {};
    const keys = Object.keys(endpoints);
    data.forEach((value, index) => {
      results[keys[index]] = value;
    });
    keys.forEach((key) => {
      switch (key) {
        case 'readings':
          const producing = results.readings[0].instantaneousDemand;
          const net = results.readings[1].instantaneousDemand;
          const consuming = producing + net;
          console.log({
            producing,
            net,
            consuming,
          });
          sse.send(
            {
              producing,
              net,
              consuming,
              baseLoad: BASE_LOAD_WATTS,
            },
            'readings',
          );
          break;
        case 'consumption':
          console.log(results.consumption);
          break;
      }
    });
  } catch (err) {
    console.error(err.name, err.message);
  }
}, 1000);

export { USER_NAME, PASSWORD, ENVOY_SERIAL, LOCAL_IP };
