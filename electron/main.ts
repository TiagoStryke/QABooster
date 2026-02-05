import {
	app,
	BrowserWindow,
	clipboard,
	globalShortcut,
	ipcMain,
	screen,
	Tray,
} from 'electron';
import * as fs from 'fs';
import * as path from 'path';

// Window management
import { createMainWindow } from './windows/main-window';
import {
	closeOverlayWindow,
	createOverlayWindow,
} from './windows/overlay-window';
import { createTray, setupTrayFlashHandler } from './windows/tray';

// IPC Handlers
import { registerDisplayHandlers } from './handlers/display-handlers';
import { registerFolderHandlers } from './handlers/folder-handlers';
import { registerPdfHandlers } from './handlers/pdf-handlers';
import { registerSettingsHandlers } from './handlers/settings-handlers';
import { registerShortcutHandlers } from './handlers/shortcut-handlers';
import { registerWindowHandlers } from './handlers/window-handlers';

// Services
import {
	captureAreaScreenshot,
	captureFullscreenScreenshot,
	captureScreenshotForOverlay,
} from './services/screenshot-service';
import { getNextScreenshotFilename } from './utils/filename-generator';

// Compatibility aliases for existing code
let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let currentFolder: string = '';
let shortcutKey: string = 'CommandOrControl+Shift+S';
let shortcutKeyArea: string = 'CommandOrControl+Shift+A';
let shortcutKeyQuick: string = 'CommandOrControl+Shift+Q';
let selectedDisplayId: number = 0;
let useSavedArea: boolean = false;
let copyToClipboard: boolean = false;
let soundEnabled: boolean = true;
let cursorInScreenshots: boolean = true;
let savedArea: { x: number; y: number; width: number; height: number } | null =
	null;
let originalWindowWidth: number = 1400;
let pendingScreenshot: Electron.NativeImage | null = null;

// Desabilitar verificação de certificado SSL para evitar erros no console
app.commandLine.appendSwitch('ignore-certificate-errors', 'true');

function registerGlobalShortcut() {
	globalShortcut.unregisterAll();

	// Fullscreen screenshot
	const ret = globalShortcut.register(shortcutKey, async () => {
		if (!currentFolder) {
			mainWindow?.webContents.send(
				'screenshot-error',
				'Selecione uma pasta primeiro',
			);
			mainWindow?.show();
			return;
		}

		try {
			const result = await captureFullscreenScreenshot({
				mainWindow,
				currentFolder,
				selectedDisplayId,
				copyToClipboard,
				cursorInScreenshots,
			});

			if (result) {
				mainWindow?.webContents.send('screenshot-captured', {
					filepath: result.filepath,
					filename: result.filename,
				});
			}

			mainWindow?.webContents.send('trigger-screenshot-flash');
		} catch (error) {
			console.error('Screenshot error:', error);
			mainWindow?.show();
			mainWindow?.webContents.send(
				'screenshot-error',
				'Erro ao capturar screenshot',
			);
		}
	});

	// Area screenshot
	const retArea = globalShortcut.register(shortcutKeyArea, async () => {
		if (!currentFolder) {
			mainWindow?.webContents.send(
				'screenshot-error',
				'Selecione uma pasta primeiro',
			);
			mainWindow?.show();
			return;
		}

		// Se deve usar área salva E tem área salva = tira print direto
		if (useSavedArea && savedArea) {
			try {
				const result = await captureAreaScreenshot({
					mainWindow,
					currentFolder,
					selectedDisplayId,
					copyToClipboard,
					cursorInScreenshots,
					area: savedArea,
				});

				if (result) {
					mainWindow?.webContents.send('screenshot-captured', {
						filepath: result.filepath,
						filename: result.filename,
					});
				}

				mainWindow?.webContents.send('trigger-screenshot-flash');
			} catch (error) {
				console.error('Screenshot error:', error);
				mainWindow?.webContents.send(
					'screenshot-error',
					'Erro ao capturar screenshot de área',
				);
			}
		} else {
			// Não tem área salva ou não quer usar = tira print e mostra overlay
			await openAreaSelectorForScreenshot();
		}
	});

	const retQuick = globalShortcut.register(shortcutKeyQuick, async () => {
		await openAreaSelectorQuick();
	});

	// Verifica quais atalhos falharam e notifica o usuário
	const failedShortcuts = [];
	if (!ret) failedShortcuts.push({ type: 'fullscreen', key: shortcutKey });
	if (!retArea) failedShortcuts.push({ type: 'area', key: shortcutKeyArea });
	if (!retQuick) failedShortcuts.push({ type: 'quick', key: shortcutKeyQuick });

	if (failedShortcuts.length > 0) {
		console.error('Falha ao registrar atalhos:', failedShortcuts);

		// Notifica o usuário na interface (frontend formatará com i18n)
		if (mainWindow && !mainWindow.isDestroyed()) {
			mainWindow.webContents.send('shortcut-registration-failed', {
				shortcuts: failedShortcuts,
			});
		}
	}
}

// Configura listeners para detectar mudanças de displays
function setupDisplayListeners() {
	// Detecta quando um display é adicionado
	screen.on('display-added', () => {
		notifyDisplaysChanged();
	});

	// Detecta quando um display é removido
	screen.on('display-removed', () => {
		const displays = screen.getAllDisplays();

		// Ajusta selectedDisplayId se estiver fora do range
		if (selectedDisplayId >= displays.length) {
			selectedDisplayId = 0;
			if (mainWindow) {
				mainWindow.webContents.send('display-changed', selectedDisplayId);
			}
		}

		notifyDisplaysChanged();
	});

	// Detecta mudanças nas métricas do display
	screen.on('display-metrics-changed', () => {
		notifyDisplaysChanged();
	});
}

// Notifica o renderer sobre mudanças nos displays
function notifyDisplaysChanged() {
	if (mainWindow && !mainWindow.isDestroyed()) {
		const displays = screen.getAllDisplays();
		const displaysData = displays.map((display, index) => ({
			id: index,
			label: `Monitor ${index + 1}${display.internal ? ' (Interno)' : ''}${
				display.bounds.x === 0 && display.bounds.y === 0 ? ' [Principal]' : ''
			}`,
			bounds: display.bounds,
			primary: display.bounds.x === 0 && display.bounds.y === 0,
		}));

		mainWindow.webContents.send('displays-updated', displaysData);
	}
}

app.whenReady().then(() => {
	// Register all IPC handlers FIRST (before creating windows)
	registerFolderHandlers(
		() => currentFolder,
		(folder) => {
			currentFolder = folder;
		},
	);

	registerDisplayHandlers(
		() => selectedDisplayId,
		(id) => {
			selectedDisplayId = id;
		},
	);

	registerSettingsHandlers(
		() => useSavedArea,
		(value) => {
			useSavedArea = value;
		},
		() => copyToClipboard,
		(value) => {
			copyToClipboard = value;
		},
		() => soundEnabled,
		(value) => {
			soundEnabled = value;
		},
		() => cursorInScreenshots,
		(value) => {
			cursorInScreenshots = value;
		},
		() => savedArea,
		(value) => {
			savedArea = value;
		},
	);

	registerPdfHandlers(() => currentFolder);

	registerShortcutHandlers(
		() => shortcutKey,
		(value) => {
			shortcutKey = value;
			registerGlobalShortcut();
		},
		() => shortcutKeyArea,
		(value) => {
			shortcutKeyArea = value;
			registerGlobalShortcut();
		},
		() => shortcutKeyQuick,
		(value) => {
			shortcutKeyQuick = value;
			registerGlobalShortcut();
		},
		registerGlobalShortcut,
	);

	registerWindowHandlers(
		() => mainWindow,
		() => originalWindowWidth,
		(width) => {
			originalWindowWidth = width;
		},
	);

	// NOW create windows (after handlers are registered)
	mainWindow = createMainWindow();
	tray = createTray(mainWindow);

	// Setup tray flash animation handler
	setupTrayFlashHandler(tray);

	// Register global shortcuts
	registerGlobalShortcut();
	setupDisplayListeners();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			mainWindow = createMainWindow();
		}
	});
});

app.on('window-all-closed', () => {
	globalShortcut.unregisterAll();
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('will-quit', () => {
	globalShortcut.unregisterAll();
});

// Função base para overlay de seleção de área
async function openAreaSelector(eventName: string, saveScreenshot: boolean) {
	if (overlayWindow) {
		closeOverlayWindow(overlayWindow);
		overlayWindow = null;
	}

	// Captura screenshot para o overlay
	const screenshot = await captureScreenshotForOverlay(
		mainWindow!,
		selectedDisplayId,
		cursorInScreenshots,
	);

	if (!screenshot) {
		return;
	}

	if (saveScreenshot) {
		pendingScreenshot = screenshot;
	}

	// Get display bounds
	const displays = screen.getAllDisplays();
	const display = displays[selectedDisplayId] || displays[0];
	const { x, y, width, height } = display.bounds;

	// Cria overlay window
	overlayWindow = await createOverlayWindow(
		x,
		y,
		width,
		height,
		screenshot.toDataURL(),
		eventName,
	);

	overlayWindow.on('closed', () => {
		overlayWindow = null;
		if (saveScreenshot) {
			pendingScreenshot = null;
		}
	});
}

// Wrapper para tirar screenshot com seleção de área
async function openAreaSelectorForScreenshot() {
	await openAreaSelector('area-selected-for-screenshot', true);
}

// Wrapper para apenas selecionar área (não salva screenshot)
async function openAreaSelectorOnly() {
	await openAreaSelector('area-selected-only', false);
}

// Wrapper para quick print (sempre copia, nunca salva)
async function openAreaSelectorQuick() {
	const originalClipboard = copyToClipboard;
	copyToClipboard = true; // Força clipboard
	await openAreaSelector('area-selected-quick', true);
	copyToClipboard = originalClipboard; // Restaura
}

// IPC handler to open area selector
ipcMain.handle('open-area-selector', async () => {
	await openAreaSelectorOnly();
	return { success: true };
});

// Handler para quando área é selecionada PARA SCREENSHOT
ipcMain.on('area-selected-for-screenshot', (_, area) => {
	savedArea = area;

	// Fecha o overlay imediatamente
	if (overlayWindow) {
		closeOverlayWindow(overlayWindow);
		overlayWindow = null;
	}

	// Salva o screenshot com crop da área
	if (pendingScreenshot && currentFolder) {
		try {
			const cropped = pendingScreenshot.crop(area);
			const filename = getNextScreenshotFilename(currentFolder);
			const filepath = path.join(currentFolder, filename);

			fs.writeFileSync(filepath, cropped.toPNG());

			// Copiar para clipboard se habilitado
			if (copyToClipboard) {
				clipboard.writeImage(cropped);
			}

			mainWindow?.webContents.send('screenshot-captured', {
				filepath,
				filename,
			});

			mainWindow?.webContents.send('trigger-screenshot-flash');
		} catch (error) {
			console.error('Error saving screenshot:', error);
		}
	}

	pendingScreenshot = null;
});

// Handler para quando área é selecionada SÓ PARA GUARDAR (botão selecionar área)
ipcMain.on('area-selected-only', (_, area) => {
	savedArea = area;

	// Fecha o overlay
	if (overlayWindow) {
		closeOverlayWindow(overlayWindow);
		overlayWindow = null;
	}

	mainWindow?.webContents.send('area-saved-with-confirmation', area);
});

// Handler para quick print (sempre clipboard, nunca salva)
ipcMain.on('area-selected-quick', (_, area) => {
	// Fecha o overlay
	if (overlayWindow) {
		closeOverlayWindow(overlayWindow);
		overlayWindow = null;
	}

	// Apenas copia para clipboard, NÃO salva arquivo
	if (pendingScreenshot) {
		const cropped = pendingScreenshot.crop(area);
		clipboard.writeImage(cropped);
		mainWindow?.webContents.send('trigger-screenshot-flash');
	}

	pendingScreenshot = null;
});

ipcMain.on('area-selection-cancelled', () => {
	if (overlayWindow) {
		closeOverlayWindow(overlayWindow);
		overlayWindow = null;
	}
	pendingScreenshot = null;
	mainWindow?.webContents.send('area-selection-cancelled');
});

// Expand/contract window for notes panel
ipcMain.on('expand-window', (_, extraWidth: number) => {
	if (mainWindow) {
		const [width, height] = mainWindow.getSize();
		originalWindowWidth = width; // Salva largura original
		mainWindow.setSize(width + extraWidth, height, true);
	}
});

ipcMain.on('contract-window', () => {
	if (mainWindow) {
		const [, height] = mainWindow.getSize();
		mainWindow.setSize(originalWindowWidth, height, true);
	}
});
