import { BrowserWindow, app, ipcMain } from "electron";
import path from "path";
import url from "url";
import fs from "fs";
import { exec } from "child_process";
const __filename$1 = url.fileURLToPath(import.meta.url);
const __dirname$1 = path.dirname(__filename$1);
const getLogPath = () => {
  const now = /* @__PURE__ */ new Date();
  const dateStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  return path.join(__dirname$1, "../../logs", `app-${dateStr}.log`);
};
const writeLog = (message) => {
  try {
    const logPath = getLogPath();
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(logPath, `${(/* @__PURE__ */ new Date()).toISOString()} - ${message}
`);
  } catch (error) {
    console.error("Failed to write log:", error);
  }
};
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const createMainWindow = () => {
  const mainWindow2 = new BrowserWindow({
    width: 1500,
    height: 900,
    icon: "electron/resource/images/code.ico",
    frame: false,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#f8f9fa",
      symbolColor: "#495057",
      height: 30
    },
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.mjs")
    },
    show: false
    // Don't show window until ready
  });
  if (process.env["VITE_DEV_SERVER_URL"]) {
    mainWindow2.loadURL(process.env["VITE_DEV_SERVER_URL"]);
  } else {
    mainWindow2.loadFile(path.join(__dirname, "../../dist/index.html"));
  }
  mainWindow2.webContents.on("did-finish-load", () => {
    writeLog("Main window loaded successfully");
    mainWindow2.show();
  });
  mainWindow2.webContents.on("preload-error", (event, preloadPath2, error) => {
    writeLog(`Preload script error (${preloadPath2}): ${error}`);
  });
  mainWindow2.webContents.on("console-message", (event, level, message) => {
    writeLog(`Renderer console [${level}]: ${message}`);
  });
  const preloadPath = path.join(__dirname, "preload.mjs");
  const exists = fs.existsSync(preloadPath);
  writeLog(`Main window created with preload: ${preloadPath}`);
  writeLog(`Preload file exists: ${exists}`);
  console.log(`[DEBUG] Preload path: ${preloadPath}`);
  console.log(`[DEBUG] Preload exists: ${exists}`);
  if (!exists) {
    console.error("[ERROR] Preload script not found at:", preloadPath);
  }
  return mainWindow2;
};
const registerWindowHandlers = (win) => {
  return {
    // 窗口拖拽
    startDrag: () => {
      win && win.isMaximized() ? win.unmaximize() : null;
      win && win.beginMoveDrag();
    },
    // 最小化窗口
    minimize: () => {
      win && win.minimize();
    },
    // 最大化/还原窗口
    maximize: () => {
      win && (win.isMaximized() ? win.unmaximize() : win.maximize());
    },
    // 关闭窗口
    close: () => {
      win && win.close();
    }
  };
};
const getCondaEnvs = async () => {
  return new Promise((resolve, reject) => {
    exec("conda env list --json", (error, stdout, stderr) => {
      if (error) {
        exec("conda info --envs", (error2, stdout2, stderr2) => {
          if (error2) {
            writeLog(`Failed to get conda envs: ${error2.message}`);
            reject(error2.message);
            return;
          }
          try {
            const envs = stdout2.split("\n").filter((line) => line.trim() && !line.startsWith("#")).map((line) => line.split(/\s+/)[0]).filter((env) => env);
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
        resolve(envs.filter((env) => env));
      } catch (e) {
        writeLog("Failed to parse conda env list");
        reject("Failed to parse conda env list");
      }
    });
  });
};
const getCurrentCondaEnv = async () => {
  return new Promise((resolve, reject) => {
    exec("conda info --json", (error, stdout, stderr) => {
      if (error) {
        writeLog(`Failed to get current conda env: ${error.message}`);
        reject(error.message);
        return;
      }
      try {
        const info = JSON.parse(stdout);
        resolve(info.active_prefix);
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
    exec(`conda activate ${path2} && conda info --json`, (error, stdout) => {
      if (error) {
        writeLog(`Failed to switch conda env: ${error.message}`);
        resolve(false);
        return;
      }
      try {
        const info = JSON.parse(stdout);
        if (info.active_prefix === path2) {
          resolve(true);
        } else {
          resolve(false);
        }
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
    try {
      if (webuiProcess) {
        webuiProcess.kill();
      }
      if (!env || !env.path) {
        throw new Error("Invalid environment object - missing path property");
      }
      console.log(`Starting WebUI service with environment: ${env.name} (${env.path})`);
      const isWindows = process.platform === "win32";
      const activateCmd = isWindows ? `conda activate ${env.path} && ` : `source activate ${env.path} && `;
      webuiProcess = exec(
        `${activateCmd}open-webui serve`,
        {
          maxBuffer: 1024 * 1024,
          shell: true,
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
      webuiProcess.stdout.on("data", (data) => {
        const logMessage = data.toString();
        writeLog(`[WebUI] ${logMessage}`);
        if (mainWindow$1) {
          mainWindow$1.webContents.send("webui-log", logMessage);
        }
      });
      webuiProcess.stderr.on("data", (data) => {
        const logMessage = data.toString();
        writeLog(`[WebUI-ERROR] ${logMessage}`);
        if (mainWindow$1) {
          mainWindow$1.webContents.send("webui-log", `[ERROR] ${logMessage}`);
        }
      });
      webuiProcess.on("exit", (code) => {
        writeLog(`WebUI process exited with code ${code}`);
        webuiProcess = null;
      });
    } catch (error) {
      writeLog(`WebUI service error: ${error.message}`);
      reject(error.message || "启动WebUI失败");
    }
  });
};
const stopWebUIService = async () => {
  return new Promise((resolve) => {
    if (webuiProcess) {
      const pid = webuiProcess.pid;
      const isWindows = process.platform === "win32";
      const killCmd = isWindows ? `taskkill /PID ${pid} /T /F` : `pkill -P ${pid}`;
      exec(killCmd, (error) => {
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
      exec("lsof -i :8080 -t | xargs kill -9", (error) => {
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
      exec(cmd, (error, stdout) => {
        if (error || !stdout.trim()) {
          callback("stopped");
        } else {
          const pid = isWindows ? stdout.split(/\s+/).pop() : stdout.trim();
          exec(
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
const initApp = async () => {
  mainWindow = createMainWindow();
  setMainWindow(mainWindow);
  handlers = registerWindowHandlers(mainWindow);
  setupIpcHandlers();
  app.on("before-quit", () => {
    stopWebUIService();
    writeLog("Application shutdown");
  });
};
const setupIpcHandlers = () => {
  if (!handlers) {
    writeLog("Window handlers not initialized");
    return;
  }
  ipcMain.handle("get-conda-envs", getCondaEnvs);
  ipcMain.handle("get-current-conda-env", getCurrentCondaEnv);
  ipcMain.handle("set-conda-env", (event, envPath) => setCondaEnv(envPath));
  ipcMain.handle("start-webui-service", (event, env) => startWebUIService(env));
  ipcMain.handle("stop-webui-service", stopWebUIService);
  ipcMain.handle("get-webui-status", getWebUIStatus);
  ipcMain.handle("write-log", (event, message) => {
    writeLog(`[App] ${message}`);
  });
  ipcMain.on("start-drag", () => handlers.startDrag());
  ipcMain.on("minimize-window", () => handlers.minimize());
  ipcMain.on("maximize-window", () => handlers.maximize());
  ipcMain.on("close-window", () => handlers.close());
};
app.whenReady().then(() => {
  initApp();
});
