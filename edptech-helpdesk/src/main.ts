import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { initializeNetwork } from './app/network.initializer';

// Expose Electron API if in desktop app
if (window.electronAPI) {
  console.log('Running in Electron desktop mode');
}

const startTime = performance.now();

// ✅ Run network detection BEFORE bootstrapping
initializeNetwork()().then(() => {
  bootstrapApplication(AppComponent, appConfig)
    .then(() => {
      const loadTime = performance.now() - startTime;
      console.log(`App loaded in ${loadTime.toFixed(2)}ms`);
    })
    .catch((err) => console.error(err));
});