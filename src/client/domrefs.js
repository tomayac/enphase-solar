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
const webLightButton = document.querySelector('.weblight-button');
const liveContainer = document.querySelector('.live-container');
const liveSection = document.querySelector('.live-section');
const producingSparkline = document.querySelector('.producing-sparkline');
const consumingSparkline = document.querySelector('.consuming-sparkline');
const importingSparkline = document.querySelector('.importing-sparkline');
const exportingSparkline = document.querySelector('.exporting-sparkline');

export {
  consumingValue,
  producingValue,
  netValue,
  producingGridAnimation,
  gridConsumingAnimation,
  producingConsumingAnimation,
  exportingOrImportingHeading,
  pipButton,
  webLightButton,
  liveContainer,
  liveSection,
  producingSparkline,
  consumingSparkline,
  importingSparkline,
  exportingSparkline,
};
