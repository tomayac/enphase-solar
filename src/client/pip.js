import { liveContainer, liveSection, pipButton } from './domrefs.js';

pipButton.hidden = false;

pipButton.addEventListener('click', async () => {
  const pipWindowWidth =
    localStorage.getItem('pipWindowWidth') || liveSection.clientWidth;
  const pipWindowHeight =
    localStorage.getItem('pipWindowHeight') || liveSection.clientHeight;
  const pipWindow = await documentPictureInPicture.requestWindow({
    width: pipWindowWidth,
    height: pipWindowHeight,
    copyStyleSheets: true,
  });
  pipWindow.document.body.append(liveSection);
  localStorage.setItem('pipWindowWidth', pipWindowWidth);
  localStorage.getItem('pipWindowHeight', pipWindowHeight);

  pipWindow.addEventListener('resize', (e) => {
    const pipWindowWidth = pipWindow.document.body.clientWidth;
    const pipWindowHeight = pipWindow.document.body.clientHeight;
    localStorage.setItem('pipWindowWidth', pipWindowWidth);
    localStorage.setItem('pipWindowHeight', pipWindowHeight);
  });

  pipWindow.addEventListener('unload', (e) => {
    liveContainer.append(liveSection);
  });
});
