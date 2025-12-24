console.log('=== ELECTRON DIAGNOSTIC ===');
console.log('process.execPath:', process.execPath);
console.log('process.type:', process.type);
console.log('process.versions.electron:', process.versions.electron);
console.log('process.versions.node:', process.versions.node);
console.log('__dirname:', __dirname);
console.log('__filename:', __filename);

// Check require.resolve
try {
  console.log('require.resolve("electron"):', require.resolve('electron'));
} catch (e) {
  console.log('require.resolve failed:', e.message);
}

const electron = require('electron');
console.log('typeof require("electron"):', typeof electron);
console.log('electron value:', electron);

if (typeof electron === 'object' && electron !== null) {
  console.log('SUCCESS: electron is an object');
  console.log('Object.keys(electron):', Object.keys(electron));

  const { app, BrowserWindow } = electron;
  console.log('app:', app);
  console.log('BrowserWindow:', BrowserWindow);

  app.on('ready', () => {
    console.log('App is ready!');
    const win = new BrowserWindow({ width: 400, height: 300 });
    win.loadURL('data:text/html,<h1>Electron Works!</h1>');
  });

  app.on('window-all-closed', () => {
    app.quit();
  });
} else {
  console.log('FAIL: electron is not an object, it is:', typeof electron);
  console.log('This indicates a module resolution issue.');
  process.exit(1);
}
