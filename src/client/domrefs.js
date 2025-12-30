const consumingValue = document.querySelector('.consuming-value');
const producingValue = document.querySelector('.producing-value');
const roofValue = document.querySelector('.roof-value');
const wallValue = document.querySelector('.wall-value');
const fenceValue = document.querySelector('.fence-value');
const netValue = document.querySelector('.net-value');
const producingGridAnimation = document.querySelector(
  '.producing-grid-animation svg',
);
const gridConsumingAnimation = document.querySelector(
  '.grid-consuming-animation svg',
);
const producingConsumingAnimation = document.querySelector(
  '.producing-consuming-animation svg',
);
const exportingOrImportingHeading = document.querySelector(
  '.exporting-or-importing',
);
const pipButton = document.querySelector('.pip-button');
const webLightButton = document.querySelector('.weblight-button');
const container = document.querySelector('.container');
const liveContainer = document.querySelector('.live-container');
const liveSection = document.querySelector('.live-section');
const producingSparkline = document.querySelector('.producing-sparkline');
const consumingSparkline = document.querySelector('.consuming-sparkline');
const importingSparkline = document.querySelector('.importing-sparkline');
const exportingSparkline = document.querySelector('.exporting-sparkline');

const ledRed = document.querySelector('.led-red');
const ledGreen = document.querySelector('.led-green');

export {
  consumingValue,
  producingValue,
  roofValue,
  wallValue,
  fenceValue,
  netValue,
  producingGridAnimation,
  gridConsumingAnimation,
  producingConsumingAnimation,
  exportingOrImportingHeading,
  pipButton,
  webLightButton,
  container,
  liveContainer,
  liveSection,
  producingSparkline,
  consumingSparkline,
  importingSparkline,
  exportingSparkline,
  ledRed,
  ledGreen,
};
