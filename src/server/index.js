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
  roof: 0,
  balcony: 0,
  fenceLeft: 0,
  fenceRight: 0,
};

app.use(express.static('public'));

app.get('/stream/meter', (req, res) => {
  sse.init(req, res);
});

app.get('/polling-data', (req, res) => {
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

async function fetchHomeAssistantSensor(entityId) {
  try {
    const response = await fetch(
      `http://192.168.1.111:8123/api/states/${entityId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${HOME_ASSISTANT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    );
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
    console.error(`Error fetching data for ${entityId}:`, error);
    return 0;
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
        case 'readings': {
          const [balconyProducing, fenceLeftProducing, fenceRightProducing] =
            await Promise.all([
              fetchHomeAssistantSensor('sensor.balcony_producing'),
              fetchHomeAssistantSensor('sensor.inverter_fence_left_power'),
              fetchHomeAssistantSensor('sensor.inverter_fence_right_power'),
            ]);

          const roofProducing = results.readings[0].instantaneousDemand;
          const net = results.readings[1].instantaneousDemand;
          const totalProducing =
            roofProducing +
            balconyProducing +
            fenceLeftProducing +
            fenceRightProducing;
          const consuming = totalProducing + net;

          console.log({
            total: Math.round(totalProducing),
            roof: Math.round(roofProducing),
            balcony: Math.round(balconyProducing),
            fenceLeft: Math.round(fenceLeftProducing),
            fenceRight: Math.round(fenceRightProducing),
            consuming: Math.round(consuming),
            [net < 0 ? 'exporting' : 'importing']: Math.abs(Math.round(net)),
          });

          pollingData.producing = Math.floor(totalProducing) || 0;
          pollingData.consuming = Math.floor(consuming) || 0;
          pollingData.net = Math.floor(net) || 0;
          pollingData.roof = Math.floor(roofProducing) || 0;
          pollingData.balcony = Math.floor(balconyProducing) || 0;
          pollingData.fenceLeft = Math.floor(fenceLeftProducing) || 0;
          pollingData.fenceRight = Math.floor(fenceRightProducing) || 0;

          sse.send(
            {
              producing: totalProducing,
              net,
              consuming,
              baseLoad: BASE_LOAD_WATTS,
              balcony: balconyProducing,
              fenceLeft: fenceLeftProducing,
              fenceRight: fenceRightProducing,
            },
            'readings',
          );
          break;
        }
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
