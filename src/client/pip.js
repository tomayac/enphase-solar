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
  });
  // Copy style sheets over from the initial document
  // so that the PiP window looks the same.
  const allCSS = [...document.styleSheets]
    .map((styleSheet) => {
      try {
        return [...styleSheet.cssRules].map((r) => r.cssText).join("");
      } catch (e) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.type = styleSheet.type;
        link.media = styleSheet.media;
        link.href = styleSheet.href;
        pipWindow.document.head.appendChild(link);
      }
    })
    .filter(Boolean)
    .join("\n");
  const style = document.createElement("style");
  style.textContent = allCSS;
  pipWindow.document.head.appendChild(style);
  pipWindow.document.body.append(liveSection);
  localStorage.setItem('pipWindowWidth', pipWindowWidth);
  localStorage.getItem('pipWindowHeight', pipWindowHeight);

  pipWindow.addEventListener('resize', (e) => {
    const pipWindowWidth = pipWindow.document.body.clientWidth;
    const pipWindowHeight = pipWindow.document.body.clientHeight;
    localStorage.setItem('pipWindowWidth', pipWindowWidth);
    localStorage.setItem('pipWindowHeight', pipWindowHeight);
  });

  pipWindow.addEventListener('pagehide', (e) => {
    liveContainer.append(liveSection);
  });
});
