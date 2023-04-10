import express from 'express';
import { getToken } from './authentication.js';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import SSE from '@gazdagandras/express-sse';

dotenv.config();
const { USERNAME, PASSWORD, ENVOY_SERIAL, LOCAL_IP, PORT } = process.env;

const app = express();
const sse = new SSE();

app.use(express.static('public'));

app.get('/stream/meter', (req, res) => {
  sse.init(req, res);
});

app.listen(PORT, () => {
  console.log(`Enphase Solar app listening on port ${PORT}`);
});

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

export { USERNAME, PASSWORD, ENVOY_SERIAL, LOCAL_IP };
