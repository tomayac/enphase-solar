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
  producingSparklineHourly,
  consumingSparklineHourly,
  importingSparklineHourly,
  exportingSparklineHourly,
  ledRed,
  ledGreen,
} from './domrefs.js';

const TREND_HISTORY_LENGTH = 60 * 5; // 5 minutes of per-second data
const HOURLY_HISTORY_LENGTH = 60; // 1 hour of per-minute data

let baseLoadWatts = 0;

const trendHistory = {
  producing: [],
  consuming: [],
  exporting: [],
  importing: [],
};

const hourlyHistory = {
  producing: [],
  consuming: [],
  exporting: [],
  importing: [],
};

// Buffer for calculating minute averages
const minuteBuffer = {
  producing: [],
  consuming: [],
  exporting: [],
  importing: [],
  timestamp: Date.now(),
};

let setWebLightColor = false;

const formatNumber = (number) => {
  number = Math.abs(number);
  if (number >= 1000) {
    return `${(number / 1000).toFixed(3)} kW`;
  }
  return `${Math.round(number)} W`;
};

// Calculate average of array
const calculateAverage = (arr) => {
  if (arr.length === 0) return 0;
  const sum = arr.reduce((a, b) => a + b, 0);
  return sum / arr.length;
};

// Process minute data
const processMinuteData = () => {
  const now = Date.now();

  // If a minute has passed, calculate averages and update hourly history
  if (now - minuteBuffer.timestamp >= 60000) {
    Object.keys(hourlyHistory).forEach((key) => {
      // Calculate average for the minute
      const average = calculateAverage(minuteBuffer[key]);

      // Add to hourly history
      hourlyHistory[key].push(Math.round(average));

      // Maintain hourly history length
      if (hourlyHistory[key].length > HOURLY_HISTORY_LENGTH) {
        hourlyHistory[key].shift();
      }

      // Clear buffer
      minuteBuffer[key] = [];
    });

    // Update timestamp
    minuteBuffer.timestamp = now;

    // Update hourly sparklines
    hourlyHistory.producing = hourlyHistory.producing.map((num) =>
      num === 0 ? 0.00001 : num,
    );
    hourlyHistory.consuming = hourlyHistory.consuming.map((num) =>
      num === 0 ? 0.00001 : num,
    );
    hourlyHistory.exporting = hourlyHistory.exporting.map((num) =>
      num === 0 ? 0.00001 : num,
    );
    hourlyHistory.importing = hourlyHistory.importing.map((num) =>
      num === 0 ? 0.00001 : num,
    );
    sparkline(producingSparklineHourly, hourlyHistory.producing);
    sparkline(consumingSparklineHourly, hourlyHistory.consuming);
    sparkline(exportingSparklineHourly, hourlyHistory.exporting);
    sparkline(importingSparklineHourly, hourlyHistory.importing);
  }
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
  const { producing, net, consuming, baseLoad, fenceLeft, fenceRight } = data;
  window.fenceLeft = fenceLeft;
  window.fenceRight = fenceRight;
  if (!gotBaseLoad) {
    baseLoadWatts = parseInt(baseLoad, 10);
    gotBaseLoad = true;
  }

  // Update trend history (per-second data)
  trendHistoryKeys.forEach((key) => {
    if (trendHistory[key].length > TREND_HISTORY_LENGTH) {
      trendHistory[key].shift();
    }
  });

  // Add current values to trend history
  trendHistory.producing.push(Math.round(producing));
  trendHistory.consuming.push(Math.round(consuming));

  // Add current values to minute buffer
  minuteBuffer.producing.push(Math.round(producing));
  minuteBuffer.consuming.push(Math.round(consuming));

  if (net < 0) {
    const absNet = Math.round(Math.abs(net));
    trendHistory.exporting.push(absNet);
    trendHistory.importing.push(0.00001);
    trendHistory.importing.push(0.00001);
    minuteBuffer.exporting.push(absNet);
    minuteBuffer.importing.push(0.00001);
  } else {
    const roundedNet = Math.round(net);
    trendHistory.exporting.push(0.00001);
    trendHistory.importing.push(roundedNet);
    trendHistory.importing.push(roundedNet);
    minuteBuffer.exporting.push(0.00001);
    minuteBuffer.importing.push(roundedNet);
  }

  // Process minute data
  processMinuteData();

  // Update values display
  consumingValue.textContent = formatNumber(consuming);
  producingValue.textContent = formatNumber(producing);
  netValue.textContent = formatNumber(net);

  // Update per-second sparklines
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
    if (isEven && producing >= baseLoadWatts) {
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
