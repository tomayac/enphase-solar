
import './style.css'
import './sse.js';

if ('wakeLock' in navigator) {
  import('./wakelock.js');
}

if ('documentPictureInPicture' in window) {
  import('./pip.js');
}
