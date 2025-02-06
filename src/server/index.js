import express from 'express';
import ViteExpress from 'vite-express';

import { getToken } from './authentication.js';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import SSE from '@gazdagandras/express-sse';

dotenv.config();
const {
  USER_NAME,
  PASSWORD,
  ENVOY_SERIAL,
  BASE_LOAD_WATTS,
  LOCAL_IP,
  PORT,
  HOST,
  HOME_ASSISTANT_TOKEN,
} = process.env;

const app = express();
const sse = new SSE();

const pollingData = {
  producing: 0,
  consuming: 0,
  net: 0,
};

app.use((req, res, next) => {
  res.set('ngrok-skip-browser-warning', '!0');
  next();
});

app.use(express.static('public'));

app.get('/stream/meter', (req, res) => {
  sse.init(req, res);
});

app.get("/polling-data", (req, res) => {
  res.send(pollingData);
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

async function fetchBalconyData() {
    try {
        const response = await fetch('http://192.168.1.111:8123/api/states/sensor.balcony_producing', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${HOME_ASSISTANT_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        let state = Number(data.state);
        if (isNaN(state)) {
            state = 0;
        }
        return state;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

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

    keys.forEach(async (key) => {
      switch (key) {
        case 'readings':
          const balcony = await fetchBalconyData();
          const producing = results.readings[0].instantaneousDemand;
          const net = results.readings[1].instantaneousDemand;
          const consuming = producing + net;
          console.log({
            total: Math.round(producing + balcony),
            roof: Math.round(producing),
            balcony: Math.round(balcony),
            consuming: Math.round(consuming),
            [net < 0 ? 'exporting' : 'importing']: Math.abs(Math.round(net)),
          });
          pollingData.producing = Math.floor(producing) + Math.floor(balcony);
          pollingData.consuming = Math.floor(consuming);
          pollingData.net = Math.floor(net);
          sse.send(
            {
              producing: producing + balcony,
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
