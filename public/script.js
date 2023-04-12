import { setWebLightColor } from './weblight.js';

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

const formatNumber = (number) => {
  return `${(Math.abs(number) / 1000).toFixed(3)} kW`;
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
  consumingValue.textContent = formatNumber(consuming);
  producingValue.textContent = formatNumber(producing);
  netValue.textContent = formatNumber(net);

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
