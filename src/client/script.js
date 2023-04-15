import { setWebLightColor } from './weblight.js';
import sparkline from '@fnando/sparkline';

const consumingValue = document.querySelector('.consuming-value');
const producingValue = document.querySelector('.producing-value');
const netValue = document.querySelector('.net-value');
const producingGridAnimation = document.querySelector(
  '.producing-grid-animation',
);
const gridConsumingAnimation = document.querySelector(
  '.grid-consuming-animation',
);
const producingConsumingAnimation = document.querySelector(
  '.producing-consuming-animation',
);
const exportingOrImportingHeading = document.querySelector(
  '.exporting-or-importing',
);
const pipButton = document.querySelector('.pip-button');
const liveContainer = document.querySelector('.live-container');
const liveSection = document.querySelector('.live-section');
const producingSparkline = document.querySelector('.producing-sparkline');
const consumingSparkline = document.querySelector('.consuming-sparkline');
const importingSparkline = document.querySelector('.importing-sparkline');
const exportingSparkline = document.querySelector('.exporting-sparkline');

const trendHistory = {
  producing: [],
  consuming: [],
  exporting: [],
  importing: [],
}

if ('wakeLock' in navigator) {
  let wakeLock = null;
  const requestWakeLock = async () => {
    try {
      wakeLock = await navigator.wakeLock.request();
      wakeLock.addEventListener('release', () => {
        console.log('Screen Wake Lock released:', wakeLock.released);
      });
      console.log('Screen Wake Lock released:', wakeLock.released);
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
    }
  };
  await requestWakeLock();
}

const formatNumber = (number) => {
  number = Math.abs(number);
  if (number >= 1000) {
    return `${(number / 1000).toFixed(3)} kW`;
  }
  return `${Math.round(number)} W`;
};

const eventSource = new EventSource('/stream/meter');

eventSource.addEventListener('error', (e) => {
  console.error('Connection to event source at', e.target.url, 'lost');
  exportingOrImportingHeading.textContent = 'Grid';
  consumingValue.textContent = 'N/A';
  producingValue.textContent = 'N/A';
  netValue.textContent = 'N/A';
  producingGridAnimation.textContent = '';
  gridConsumingAnimation.textContent = '';
  producingConsumingAnimation.textContent = '';
  setWebLightColor(0, 0, 0);
  setTimeout(() => {
    window.location.reload();
  }, 30_000);
});

eventSource.addEventListener('open', (e) => {
  console.log('Connected to event source at', e.target.url);
});

let isEven = true;
eventSource.addEventListener('readings', async (e) => {
  isEven = !isEven;
  const data = JSON.parse(e.data);
  const { producing, net, consuming } = data;
  trendHistory.producing.push(Math.round(producing));
  trendHistory.consuming.push(Math.round(consuming));
  if (net < 0) {
    trendHistory.exporting.push(Math.round(Math.abs(net)));
    trendHistory.importing.push(0.00001);
  } else {
    trendHistory.exporting.push(0.00001);
    trendHistory.importing.push(Math.round(net));
  }

  consumingValue.textContent = formatNumber(consuming);
  producingValue.textContent = formatNumber(producing);
  netValue.textContent = formatNumber(net);

  sparkline(producingSparkline, trendHistory.producing);
  sparkline(consumingSparkline, trendHistory.consuming);
  sparkline(exportingSparkline, trendHistory.exporting);
  sparkline(importingSparkline, trendHistory.importing);

  if (producing > 0 && consuming > 0) {
    producingConsumingAnimation.textContent = '→';
  } else {
    producingConsumingAnimation.textContent = '';
  }

  if (producing > 0 && net < 0) {
    producingGridAnimation.textContent = '←';
  } else {
    producingGridAnimation.textContent = '';
  }

  if (net < 0) {
    exportingOrImportingHeading.textContent = 'Exporting';
    gridConsumingAnimation.textContent = '';
    if (isEven) {
      await setWebLightColor(0, 64, 0);
    }
  } else {
    exportingOrImportingHeading.textContent = 'Importing';
    gridConsumingAnimation.textContent = '→';
    if (isEven) {
      await setWebLightColor(64, 0, 0);
    }
  }
  if (!isEven) {
    await setWebLightColor(0, 0, 0);
  }
});

if ('documentPictureInPicture' in window) {
  pipButton.addEventListener('click', async () => {
    const pipWindow = await documentPictureInPicture.requestWindow({
      initialAspectRatio: liveSection.clientWidth / liveSection.clientHeight,
      copyStyleSheets: true,
    });
    pipWindow.document.body.append(liveSection);

    pipWindow.addEventListener('unload', (event) => {
      liveContainer.append(liveSection);
    });
  });
} else {
  pipButton.remove();
}
