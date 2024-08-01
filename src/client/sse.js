import sparkline from '@fnando/sparkline';
import {
  consumingValue,
  producingValue,
  netValue,
  container,
  producingGridAnimation,
  gridConsumingAnimation,
  producingConsumingAnimation,
  exportingOrImportingHeading,
  producingSparkline,
  consumingSparkline,
  importingSparkline,
  exportingSparkline,
  ledRed,
  ledGreen,
} from './domrefs.js';

const TREND_HISTORY_LENGTH = 60 * 5;

let baseLoadWatts = 0;

const trendHistory = {
  producing: [],
  consuming: [],
  exporting: [],
  importing: [],
};

let setWebLightColor = false;

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
  setWebLightColor && setWebLightColor(0, 0, 0);
  setTimeout(() => {
    window.location.reload();
  }, 30_000);
});

eventSource.addEventListener('open', (e) => {
  console.log('Connected to event source at', e.target.url);
});

let isEven = true;
let gotBaseLoad = false;
const trendHistoryKeys = Object.keys(trendHistory);
eventSource.addEventListener('readings', (e) => {
  container.style.visibility = 'visible';
  isEven = !isEven;
  const data = JSON.parse(e.data);
  const { producing, net, consuming, baseLoad } = data;
  if (!gotBaseLoad) {
    baseLoadWatts = parseInt(baseLoad, 10);
    gotBaseLoad = true;
  }
  trendHistoryKeys.forEach((key) => {
    if (trendHistory[key].length > TREND_HISTORY_LENGTH) {
      trendHistory[key].shift();
    }
  });

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

  if (producing > consuming) {
    ledGreen.style.display = 'inline-block';
    ledRed.style.display = 'none';
  } else {
    ledGreen.style.display = 'none';
    ledRed.style.display = 'inline-block';
  }

  if (producing > 0 && consuming > 0) {
    producingConsumingAnimation.style.visibility = 'visible';
  } else {
    producingConsumingAnimation.style.visibility = 'hidden';
  }

  if (producing > 0 && net < 0) {
    producingGridAnimation.style.visibility = 'visible';
  } else {
    producingGridAnimation.style.visibility = 'hidden';
  }

  if (net < 0) {
    exportingOrImportingHeading.textContent = 'Exporting';
    gridConsumingAnimation.style.visibility = 'hidden';
    if (isEven) {
      setWebLightColor && setWebLightColor(0, 64, 0);
    }
  } else {
    exportingOrImportingHeading.textContent = 'Importing';
    gridConsumingAnimation.style.visibility = 'visible';
    if (isEven && producing >= baseLoadWatts) {
      setWebLightColor && setWebLightColor(64, 0, 0);
    }
  }
  if (!isEven) {
    setWebLightColor && setWebLightColor(0, 0, 0);
  }
});

if ('usb' in navigator) {
  (async () => {
    ({ setWebLightColor } = await import('./weblight.js'));
  })();
}
