"use strict";
const electron = require("electron");
const path = require("path");
const fs = require("fs");
const url = require("url");
const child_process = require("child_process");
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
const __filename$1 = url.fileURLToPath(typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("main.js", document.baseURI).href);
const __dirname$1 = path.dirname(__filename$1);
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};
const currentLevel = process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG;
const getLogPath = () => {
  const now = /* @__PURE__ */ new Date();
  const dateStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  return path.join(__dirname$1, "../../logs", `app-${dateStr}.log`);
};
const writeLog = (message, level = LogLevel.INFO) => {
  if (level < currentLevel) return;
  try {
    const logPath = getLogPath();
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const levelStr = Object.keys(LogLevel).find((key) => LogLevel[key] === level);
    const logMessage = `${(/* @__PURE__ */ new Date()).toISOString()} [${levelStr}] - ${message}`;
    if (process.env.NODE_ENV !== "production") {
      const colors = {
        [LogLevel.DEBUG]: "\x1B[36m",
        // Cyan
        [LogLevel.INFO]: "\x1B[32m",
        // Green
        [LogLevel.WARN]: "\x1B[33m",
        // Yellow
        [LogLevel.ERROR]: "\x1B[31m"
        // Red
      };
      console.log(`${colors[level]}${logMessage}\x1B[0m`);
    }
    fs.appendFileSync(logPath, `${logMessage}
`);
  } catch (error2) {
    console.error("Failed to write log:", error2);
  }
};
function createMainWindow() {
  const mainWindow2 = new electron.BrowserWindow({
    width: 1500,
    height: 900,
    icon: "electron/resource/images/code.ico",
    frame: false,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "transparent",
      symbolColor: "#495057",
      height: 30
    },
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.resolve(__dirname, "preload.js")
    },
    show: false
  });
  const devServerUrl = process.env["VITE_DEV_SERVER_URL"];
  if (devServerUrl) {
    console.log("Loading dev server URL:", devServerUrl);
    mainWindow2.loadURL(devServerUrl);
  } else {
    console.log("Loading production index.html");
    mainWindow2.loadFile(path.join(__dirname, "../../dist/index.html"));
  }
  mainWindow2.webContents.on("did-finish-load", () => {
    writeLog("Main window loaded successfully");
    mainWindow2.show();
  });
  mainWindow2.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    writeLog(`Failed to load: ${errorDescription} (code ${errorCode})`);
  });
  mainWindow2.webContents.on("preload-error", (event, preloadPath2, error) => {
    writeLog(`Preload script error (${preloadPath2}): ${error.message}`);
  });
  mainWindow2.webContents.on("console-message", (event, level, message) => {
    writeLog(`Renderer console [${level}]: ${message}`);
  });
  const preloadPath = path.join(__dirname, "../dist-electron/preload.js");
  const exists = require("fs").existsSync(preloadPath);
  writeLog(`Main window created with preload: ${preloadPath}`);
  writeLog(`Preload file exists: ${exists}`);
  console.log(`[DEBUG] Preload path: ${preloadPath}`);
  console.log(`[DEBUG] Preload exists: ${exists}`);
  if (!exists) {
    console.error("[ERROR] Preload script not found at:", preloadPath);
  }
  return mainWindow2;
}
function registerWindowHandlers(win) {
  return {
    startDrag: () => {
      if (win) {
        if (win.isMaximized()) win.unmaximize();
        win.setPosition(win.getPosition()[0], win.getPosition()[1] - 1);
      }
    },
    minimize: () => {
      win && win.minimize();
    },
    maximize: () => {
      win && (win.isMaximized() ? win.unmaximize() : win.maximize());
    },
    close: () => {
      win && win.close();
    }
  };
}
const getCondaEnvs = async () => {
  return new Promise((resolve, reject) => {
    child_process.exec("conda env list --json", (error, stdout, stderr) => {
      if (error) {
        child_process.exec("conda info --envs", (error2, stdout2, stderr2) => {
          if (error2) {
            writeLog(`Failed to get conda envs: ${error2.message}`);
            reject(error2.message);
            return;
          }
          try {
            const envs = stdout2.split("\n").filter((line) => line.trim() && !line.startsWith("#")).map((line) => line.split(/\s+/)[0]).filter((env) => !!env);
            resolve(envs);
          } catch (e) {
            writeLog("Failed to parse conda env list");
            reject("Failed to parse conda env list");
          }
        });
        return;
      }
      try {
        const envs = JSON.parse(stdout).envs;
        resolve(envs.filter((env) => !!env));
      } catch (e) {
        writeLog("Failed to parse conda env list");
        reject("Failed to parse conda env list");
      }
    });
  });
};
const getCurrentCondaEnv = async () => {
  return new Promise((resolve, reject) => {
    child_process.exec("conda info --json", (error, stdout, stderr) => {
      if (error) {
        writeLog(`Failed to get current conda env: ${error.message}`);
        reject(error.message);
        return;
      }
      try {
        const info = JSON.parse(stdout);
        resolve(info.active_prefix || null);
      } catch (e) {
        writeLog("Failed to parse conda info");
        reject("Failed to parse conda info");
      }
    });
  });
};
const setCondaEnv = async (env) => {
  return new Promise((resolve) => {
    const path2 = typeof env === "object" ? env.path : env;
    if (!path2) {
      resolve(false);
      return;
    }
    child_process.exec(`conda activate ${path2} && conda info --json`, (error, stdout) => {
      if (error) {
        writeLog(`Failed to switch conda env: ${error.message}`);
        resolve(false);
        return;
      }
      try {
        const info = JSON.parse(stdout);
        resolve(info.active_prefix === path2);
      } catch (e) {
        writeLog("Failed to parse conda info");
        resolve(false);
      }
    });
  });
};
let webuiProcess = null;
let mainWindow$1 = null;
const setMainWindow = (window) => {
  mainWindow$1 = window;
};
const startWebUIService = async (env) => {
  return new Promise((resolve, reject) => {
    var _a, _b;
    try {
      if (webuiProcess) {
        webuiProcess.kill();
      }
      if (!(env == null ? void 0 : env.path)) {
        throw new Error("Invalid environment object - missing path property");
      }
      console.log(`Starting WebUI service with environment: ${env.name || "unknown"} (${env.path})`);
      const isWindows = process.platform === "win32";
      const activateCmd = isWindows ? `conda activate ${env.path} && ` : `source activate ${env.path} && `;
      webuiProcess = child_process.exec(
        `${activateCmd}open-webui serve`,
        {
          maxBuffer: 1024 * 1024,
          shell: "true",
          windowsHide: false
        },
        (error, stdout, stderr) => {
          if (error) {
            writeLog(`WebUI service error: ${error.message}`);
            reject(error.message);
            return;
          }
          resolve(stdout);
        }
      );
      (_a = webuiProcess.stdout) == null ? void 0 : _a.on("data", (data) => {
        const logMessage = data.toString();
        writeLog(`[WebUI] ${logMessage}`);
        mainWindow$1 == null ? void 0 : mainWindow$1.webContents.send("webui-log", logMessage);
      });
      (_b = webuiProcess.stderr) == null ? void 0 : _b.on("data", (data) => {
        const logMessage = data.toString();
        writeLog(`[WebUI-ERROR] ${logMessage}`);
        mainWindow$1 == null ? void 0 : mainWindow$1.webContents.send("webui-log", `[ERROR] ${logMessage}`);
      });
      webuiProcess.on("exit", (code) => {
        writeLog(`WebUI process exited with code ${code}`);
        webuiProcess = null;
      });
    } catch (error) {
      const err = error;
      writeLog(`WebUI service error: ${err.message}`);
      reject(err.message || "启动WebUI失败");
    }
  });
};
const stopWebUIService = async () => {
  return new Promise((resolve) => {
    if (webuiProcess) {
      const pid = webuiProcess.pid;
      const isWindows = process.platform === "win32";
      const killCmd = isWindows ? `taskkill /PID ${pid} /T /F` : `pkill -P ${pid}`;
      child_process.exec(killCmd, (error) => {
        if (error) {
          writeLog(`Failed to kill WebUI process: ${error.message}`);
          resolve("Failed to stop service");
        } else {
          webuiProcess = null;
          writeLog("WebUI service stopped");
          resolve("Service stopped");
        }
      });
    } else {
      child_process.exec("lsof -i :8080 -t | xargs kill -9", (error) => {
        if (error) {
          writeLog("No running WebUI service found");
          resolve("No running service");
        } else {
          writeLog("WebUI service stopped (via port kill)");
          resolve("Service stopped");
        }
      });
    }
  });
};
const getWebUIStatus = async () => {
  return new Promise((resolve) => {
    resolve("loading");
    const checkStatus = (callback) => {
      if (webuiProcess) {
        callback("running");
        return;
      }
      const isWindows = process.platform === "win32";
      const cmd = isWindows ? "netstat -ano | findstr 8080" : "lsof -i :8080 -t";
      child_process.exec(cmd, (error, stdout) => {
        if (error || !stdout.trim()) {
          callback("stopped");
        } else {
          const pid = isWindows ? stdout.split(/\s+/).pop() : stdout.trim();
          child_process.exec(
            isWindows ? `tasklist /FI "PID eq ${pid}" | findstr /i "open-webui"` : `ps -p ${pid} -o comm= | grep -i open-webui`,
            (error2, stdout2) => {
              if (error2 || !stdout2) {
                callback("port-in-use");
              } else {
                callback("running");
              }
            }
          );
        }
      });
    };
    checkStatus((status) => {
      if (status === "running") {
        writeLog("WebUI service is running");
        resolve(status);
      } else if (status === "port-in-use") {
        writeLog("Port 8080 is in use by another process");
        resolve("port-in-use");
      } else {
        setTimeout(() => checkStatus(resolve), 1e3);
      }
    });
  });
};
let mainWindow = null;
let handlers = null;
const appState = {
  isQuitting: false
};
const initApp = async () => {
  const gotTheLock = electron.app.requestSingleInstanceLock();
  if (!gotTheLock) {
    electron.app.quit();
    return;
  }
  electron.app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  try {
    mainWindow = createMainWindow();
    setMainWindow(mainWindow);
    handlers = registerWindowHandlers(mainWindow);
    mainWindow.webContents.on("before-input-event", (event, input) => {
      if (input.key === "F5") {
        mainWindow == null ? void 0 : mainWindow.webContents.openDevTools();
      }
    });
    setupIpcHandlers();
  } catch (error) {
    console.error("App initialization failed:", error);
    process.exit(1);
  }
};
const setupIpcHandlers = () => {
  if (!handlers) {
    writeLog("Window handlers not initialized");
    return;
  }
  electron.ipcMain.handle("get-conda-envs", getCondaEnvs);
  electron.ipcMain.handle("get-current-conda-env", getCurrentCondaEnv);
  electron.ipcMain.handle("set-conda-env", (event, envPath) => setCondaEnv(envPath));
  electron.ipcMain.handle("start-webui-service", (event, env) => startWebUIService(env));
  electron.ipcMain.handle("stop-webui-service", stopWebUIService);
  electron.ipcMain.handle("get-webui-status", getWebUIStatus);
  electron.ipcMain.handle("write-log", (event, message) => {
    writeLog(`[App] ${message}`);
  });
  electron.ipcMain.handle("log-error", (event, payload) => {
    const errorMsg = `[ERROR] ${payload.timestamp} - ${payload.message}`;
    writeLog(errorMsg);
    if (payload.stack) {
      writeLog(`[STACK] ${payload.stack}`);
    }
  });
  electron.ipcMain.on("start-drag", () => handlers == null ? void 0 : handlers.startDrag());
  electron.ipcMain.on("minimize-window", () => handlers == null ? void 0 : handlers.minimize());
  electron.ipcMain.on("maximize-window", () => handlers == null ? void 0 : handlers.maximize());
  electron.ipcMain.on("close-window", () => handlers == null ? void 0 : handlers.close());
};
electron.app.on("before-quit", () => {
  appState.isQuitting = true;
  stopWebUIService();
  writeLog("Application shutdown");
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("activate", () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    initApp().catch((error) => {
      console.error("Failed to reinitialize app:", error);
      process.exit(1);
    });
  }
});
electron.app.whenReady().then(() => {
  initApp().catch((error) => {
    console.error("Failed to initialize app:", error);
    process.exit(1);
  });
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  appState.lastError = error;
  writeLog(`[CRASH] ${error.message}
${error.stack || ""}`);
  if (!appState.isQuitting) {
    electron.BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send("app-crashed", {
        message: error.message,
        stack: error.stack
      });
    });
  }
});
process.on("unhandledRejection", (reason, promise) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  console.error("Unhandled Rejection at:", promise, "reason:", error);
  appState.lastError = error;
  writeLog(`[UNHANDLED_REJECTION] ${error.message}
${error.stack || ""}`);
});
