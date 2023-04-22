import { webLightButton } from './domrefs.js';

webLightButton.hidden = false;

let webLight;

(async () => {
  const [_device] = await navigator.usb.getDevices();
  if (_device?.vendorId === 0x1209 && _device?.productId === 0xa800) {
    webLight = _device;
    await webLight.open();
  }
})();

webLightButton.addEventListener('click', async () => {
  const filters = [{ vendorId: 0x1209, productId: 0xa800 }];
  try {
    const _device = await navigator.usb.requestDevice({ filters: filters });
    webLight = _device;
    await webLight.open();
    if (webLight.configuration === null) {
      await webLight.selectConfiguration(1);
    }
    await webLight.claimInterface(0);
  } catch (err) {
    console.error(err.name, err.message);
  }
});

const setWebLightColor = async (r, g, b) => {
  if (!webLight) {
    return;
  }
  if (webLight.opened) {
    const payload = new Uint8Array([r, g, b]);
    await webLight.controlTransferOut(
      {
        requestType: 'vendor',
        recipient: 'device',
        request: 1,
        value: 0,
        index: 0,
      },
      payload,
    );
  }
};

export { setWebLightColor };
