const consumingValue = document.querySelector('.consuming-value');
const producingValue = document.querySelector('.producing-value');
const netValue = document.querySelector('.net-value');
const exportingOrImportingElem = document.querySelector(
  '.exporting-or-importing',
);

const formatNumber = (number) => {
  return `${(Math.abs(number) / 1000).toFixed(3)} kW`;
};

const eventSource = new EventSource('/stream/meter');

eventSource.addEventListener('error', (e) => {
  console.error(e.name, e.message);
});

eventSource.addEventListener('open', (e) => {
  console.log('Connected to event source at', e.target.url);
});

eventSource.addEventListener('readings', (e) => {
  const data = JSON.parse(e.data);
  const { producing, net, consuming } = data;
  consumingValue.textContent = formatNumber(consuming);
  producingValue.textContent = formatNumber(producing);
  netValue.textContent = formatNumber(net);
  if (net < 0) {
    exportingOrImportingElem.textContent = 'Exporting';
  } else {
    exportingOrImportingElem.textContent = 'Importing';
  }
});
