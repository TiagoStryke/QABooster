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

// Config
import { APP_CONSTANTS } from './config/app-config';

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

/**
 * Tenta criar a estrutura de pastas se necessário
 * Chamado quando screenshot é capturado pela primeira vez
 */
async function tryCreateFolderIfNeeded(): Promise<boolean> {
	console.log('[tryCreate] 🚀 Starting - currentFolder:', currentFolder);

	// Se já tem pasta, não precisa criar
	if (currentFolder) {
		console.log('[tryCreate] ✅ Already have folder, returning true');
		return true;
	}

	try {
		console.log('[tryCreate] 📋 Fetching state from frontend...');
		// Pega o estado atual do frontend
		const stateResult = await mainWindow?.webContents.executeJavaScript(`
			(function() {
				try {
					const headerData = JSON.parse(localStorage.getItem('qabooster-headerData') || '{}');
					const appSettings = JSON.parse(localStorage.getItem('qabooster-app-settings') || '{}');
					const rootFolder = appSettings.rootFolder || '';
					return { success: true, headerData, rootFolder };
				} catch (e) {
					return { success: false, error: e.message };
				}
			})()
		`);

		console.log(
			'[tryCreate] State result:',
			JSON.stringify(stateResult, null, 2),
		);

		if (!stateResult?.success || !stateResult.rootFolder) {
			console.log('[tryCreate] ❌ Invalid state or no rootFolder');
			return false;
		}

		const { headerData, rootFolder } = stateResult;

		// Importa e valida
		const { validateHeaderForScreenshot, ensureFolderStructure } =
			await import('./services/folder-structure-service');

		const isValid = validateHeaderForScreenshot(headerData);
		console.log('[tryCreate] Validation result:', isValid);

		if (!isValid) {
			console.log('[tryCreate] ❌ Header validation failed');
			return false;
		}

		// Cria a estrutura
		console.log('[tryCreate] 📁 Creating folder structure...');
		const folderPath = ensureFolderStructure(rootFolder, headerData);

		if (folderPath) {
			console.log('[MAIN] ✅ Folder created:', folderPath);
			// Atualiza currentFolder globalmente
			currentFolder = folderPath;

			// Salva headerData na pasta imediatamente
			const { saveJSON } = await import('./services/file-service');
			const headerFilePath = path.join(
				folderPath,
				APP_CONSTANTS.CONFIG.HEADER_DATA,
			);
			await saveJSON(headerFilePath, headerData);
			console.log('[MAIN] 💾 Config saved to:', headerFilePath);

			// Notifica o frontend (fromShortcut = não limpar headers)
			console.log(
				'[MAIN] 📤 Sending folder-created event with fromShortcut=true',
			);
			mainWindow?.webContents.send('folder-created', {
				path: folderPath,
				fromShortcut: true,
			});

			console.log('[tryCreate] ✅ SUCCESS - returning true');
			return true;
		}

		console.log('[tryCreate] ❌ No folder path created');
		return false;
	} catch (error) {
		console.error('[tryCreate] ❌ ERROR:', error);
		return false;
	}
}

function registerGlobalShortcut() {
	globalShortcut.unregisterAll();

	// Fullscreen screenshot
	const ret = globalShortcut.register(shortcutKey, async () => {
		console.log('[MAIN] 🔘 Fullscreen shortcut pressed');
		console.log('[MAIN] Current folder BEFORE check:', currentFolder);

		// Check if currentFolder is set but folder doesn't exist physically
		if (currentFolder) {
			const fs = await import('fs');
			if (!fs.existsSync(currentFolder)) {
				console.log(
					'[MAIN] ⚠️ Folder path set but does not exist physically:',
					currentFolder,
				);
				console.log('[MAIN] 🔨 Creating folder structure...');
				const created = await tryCreateFolderIfNeeded();
				if (!created) {
					console.log('[MAIN] ❌ Failed to create folder');
					mainWindow?.webContents.send(
						'screenshot-error',
						'Erro ao criar pasta de teste',
					);
					return;
				}
				console.log('[MAIN] ✅ Folder created successfully');
			}
		}

		// Try to create folder if needed
		if (!currentFolder) {
			console.log('[MAIN] No folder - calling tryCreateFolderIfNeeded()');
			const created = await tryCreateFolderIfNeeded();
			console.log('[MAIN] tryCreateFolderIfNeeded result:', created);
			console.log('[MAIN] Current folder AFTER tryCreate:', currentFolder);

			if (!created) {
				console.log('[MAIN] ❌ Failed to create folder - aborting');
				mainWindow?.webContents.send(
					'screenshot-error',
					'Preencha os campos obrigatórios primeiro',
				);
				mainWindow?.show();
				return;
			}

			console.log('[MAIN] ✅ Folder created successfully, continuing...');
		}

		console.log(
			'[MAIN] 📸 Attempting to capture screenshot in folder:',
			currentFolder,
		);
		try {
			const result = await captureFullscreenScreenshot({
				mainWindow,
				currentFolder,
				selectedDisplayId,
				copyToClipboard,
				cursorInScreenshots,
			});

			console.log('[MAIN] Screenshot result:', result);

			if (result) {
				console.log(
					'[MAIN] ✅ Screenshot captured successfully:',
					result.filepath,
				);
				// Screenshot capturado com sucesso - notifica frontend
				mainWindow?.webContents.send('screenshot-captured', {
					filepath: result.filepath,
					filename: result.filename,
				});

				// Toca som APENAS if screenshot foi capturado
				console.log('[MAIN] 🔊 Sending trigger-screenshot-flash');
				mainWindow?.webContents.send('trigger-screenshot-flash');
			} else {
				console.log('[MAIN] ❌ Screenshot failed - no result');
			}
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
		// Try to create folder if needed
		if (!currentFolder) {
			const created = await tryCreateFolderIfNeeded();
			if (!created) {
				mainWindow?.webContents.send(
					'screenshot-error',
					'Preencha os campos obrigatórios primeiro',
				);
				mainWindow?.show();
				return;
			}
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

					// Toca som APENAS se screenshot foi capturado
					mainWindow?.webContents.send('trigger-screenshot-flash');
				}
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
ipcMain.on('area-selected-for-screenshot', async (_, area) => {
	savedArea = area;

	// Fecha o overlay imediatamente
	if (overlayWindow) {
		closeOverlayWindow(overlayWindow);
		overlayWindow = null;
	}

	// Try to create folder if needed
	if (!currentFolder) {
		const created = await tryCreateFolderIfNeeded();
		if (!created) {
			mainWindow?.webContents.send(
				'screenshot-error',
				'Preencha os campos obrigatórios primeiro',
			);
			mainWindow?.show();
			pendingScreenshot = null;
			return;
		}
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

// Clear current folder (when starting new test)
ipcMain.on('clear-current-folder', () => {
	console.log('[MAIN] 🧹 Clearing currentFolder (new test started)');
	currentFolder = '';
});
