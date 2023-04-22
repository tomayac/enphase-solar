import { liveContainer, liveSection, pipButton } from './domrefs.js';

pipButton.hidden = false;

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
