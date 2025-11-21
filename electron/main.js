import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let trackerProcess;

function createWindow() {
  // Get primary display size
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    transparent: true,     // Make window transparent
    frame: false,          // Remove title bar
    alwaysOnTop: true,     // Keep floating above other apps
    hasShadow: false,
    resizable: false,
    skipTaskbar: true,     // Hide from taskbar (optional)
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
    },
  });

  console.log('[Main]: Preload script path:', path.join(__dirname, 'preload.js'));

  // Load the React app
  // In production (built exe), load from file. In dev, load localhost.
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
  mainWindow.loadURL(startUrl);

  // DEFAULT: Ignore mouse events (click-through) so user can click Notepad behind us
  // 'forward: true' enables mouse move events to still reach our app (for hover detection)
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  // IPC Listener: React tells us when to capture/release mouse
  ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.setIgnoreMouseEvents(ignore, { forward: true });
  });

  // IPC Listener: Logger for Renderer
  ipcMain.on('log', (event, message) => {
    console.log('[Renderer]:', message);
  });

  // Start PowerShell Tracker
  startTracker();
}

function startTracker() {
  const trackerPath = path.join(__dirname, '../resources/tracker.ps1');
  console.log("Starting tracker from:", trackerPath);

  trackerProcess = spawn('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', trackerPath
  ]);

  trackerProcess.stdout.on('data', (data) => {
    try {
      const str = data.toString().trim();
      console.log('Tracker Output:', str); // DEBUG LOG
      // PowerShell might output multiple lines or partial chunks. 
      // For simplicity, we assume one JSON object per line or check for valid JSON.
      if (str.startsWith('{') && str.endsWith('}')) {
        const coords = JSON.parse(str);
        if (mainWindow && !mainWindow.isDestroyed()) {

          // 1. Find which display the cursor is on
          const cursorPoint = { x: coords.x, y: coords.y };
          const display = screen.getDisplayNearestPoint(cursorPoint);
          const scaleFactor = display.scaleFactor;

          // 2. Convert Physical -> Logical Coordinates
          // Note: Electron windows are positioned in logical coordinates relative to the primary display.
          // If secondary monitor, we need to be careful. 
          // But generally, dividing by scaleFactor is the first step for size.
          // For position, it's tricky because 'bounds' are logical.

          // Simple approach: Convert everything to logical first
          let logicalX = coords.x / scaleFactor;
          let logicalY = coords.y / scaleFactor;
          const logicalHeight = coords.height / scaleFactor;

          // 3. Clamp to Display Bounds (Logical)
          // display.bounds is in logical pixels
          const bounds = display.bounds;

          // Ensure it doesn't go off the right edge
          if (logicalX > bounds.x + bounds.width - 50) {
            logicalX = bounds.x + bounds.width - 50;
          }
          // Ensure it doesn't go off the bottom
          if (logicalY > bounds.y + bounds.height - 50) {
            logicalY = bounds.y + bounds.height - 50;
          }
          // Ensure it doesn't go off the left/top
          if (logicalX < bounds.x) logicalX = bounds.x;
          if (logicalY < bounds.y) logicalY = bounds.y;

          const logicalCoords = {
            x: logicalX,
            y: logicalY,
            height: logicalHeight,
            text: coords.text
          };

          console.log('Sending to Renderer (Clamped):', logicalCoords); // DEBUG LOG
          mainWindow.webContents.send('caret-position-update', logicalCoords);
        }
      }
    } catch (e) {
      console.error('JSON Parse Error:', e); // DEBUG LOG
    }
  });

  trackerProcess.stderr.on('data', (data) => {
    console.error(`Tracker Error: ${data}`);
  });

  trackerProcess.on('close', (code) => {
    console.log(`Tracker process exited with code ${code}`);
  });
}

app.whenReady().then(createWindow);

// Handle Insert Text
ipcMain.on('insert-text', (event, { processId, text }) => {
  console.log(`[Main]: Inserting text into PID ${processId}: ${text.substring(0, 20)}...`);

  const scriptPath = path.join(__dirname, '../resources/inserter.ps1');

  const ps = spawn('powershell', [
    '-ExecutionPolicy', 'Bypass',
    '-File', scriptPath,
    '-ProcessId', processId.toString(),
    '-Text', text
  ]);

  ps.stdout.on('data', (data) => console.log(`[Inserter]: ${data}`));
  ps.stderr.on('data', (data) => console.error(`[Inserter Error]: ${data}`));
  ps.on('close', (code) => console.log(`[Inserter]: Process exited with code ${code}`));
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  if (trackerProcess) {
    trackerProcess.kill();
  }
});