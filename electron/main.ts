import {
    app,
    BrowserWindow,
    clipboard,
    desktopCapturer,
    dialog,
    globalShortcut,
    ipcMain,
    nativeImage,
    screen,
    shell,
    Tray,
} from 'electron';
import * as fs from 'fs';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let currentFolder: string = '';
let shortcutKey: string = 'CommandOrControl+Shift+S';
let shortcutKeyArea: string = 'CommandOrControl+Shift+A';
let selectedDisplayId: number = 0; // ID do display selecionado
let useSavedArea: boolean = false; // Se deve usar área salva ou sempre perguntar
let copyToClipboard: boolean = false; // Se deve copiar para área de transferência
let savedArea: { x: number; y: number; width: number; height: number } | null =
	null;
let originalWindowWidth: number = 1400; // Largura original da janela
let pendingScreenshot: Electron.NativeImage | null = null; // Screenshot pendente para salvar

// Desabilitar verificação de certificado SSL para evitar erros no console
app.commandLine.appendSwitch('ignore-certificate-errors', 'true');

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1400,
		height: 900,
		minWidth: 1000,
		minHeight: 600,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			webSecurity: false,
		},
		titleBarStyle: 'hiddenInset',
		backgroundColor: '#0f172a',
	});

	if (process.env.NODE_ENV === 'development') {
		mainWindow.loadURL('http://localhost:3000');
		// Apenas abre DevTools se a variável DEVTOOLS estiver definida
		if (process.env.DEVTOOLS === 'true') {
			mainWindow.webContents.openDevTools();
		}
	} else {
		// Em produção, usa app.getAppPath() que funciona mesmo empacotado
		const indexPath = path.join(
			app.getAppPath(),
			'dist',
			'renderer',
			'index.html',
		);
		mainWindow.loadFile(indexPath);
	}

	mainWindow.on('closed', () => {
		mainWindow = null;
	});
}

function createTray() {
	// Cria ícone SVG de clipboard com checkmark
	const createTrayIcon = (color: string = '#ffffff') => {
		const svg = `
			<svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
				<!-- Clipboard -->
				<path fill="${color}" d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
				<!-- Checkmark -->
				<path fill="${color}" stroke="#1e293b" stroke-width="0.5" d="M10 17l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9z"/>
			</svg>
		`;
		return nativeImage.createFromDataURL(
			'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64'),
		);
	};

	tray = new Tray(createTrayIcon());
	tray.setToolTip('QA Booster - Gerador de evidências');

	tray.on('click', () => {
		if (mainWindow) {
			if (mainWindow.isVisible()) {
				mainWindow.hide();
			} else {
				mainWindow.show();
			}
		}
	});

	// Função para animar o ícone (piscar em verde)
	ipcMain.on('screenshot-flash', () => {
		if (!tray) return;

		// Verde
		tray.setImage(createTrayIcon('#22c55e'));

		setTimeout(() => {
			if (tray) tray.setImage(createTrayIcon('#ffffff'));
		}, 150);

		setTimeout(() => {
			if (tray) tray.setImage(createTrayIcon('#22c55e'));
		}, 300);

		setTimeout(() => {
			if (tray) tray.setImage(createTrayIcon('#ffffff'));
		}, 450);
	});
}

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
			const displays = screen.getAllDisplays();
			const display = displays[selectedDisplayId] || displays[0];
			const { width, height } = display.bounds;

			const sources = await desktopCapturer.getSources({
				types: ['screen'],
				thumbnailSize: {
					width: width,
					height: height,
				},
			});

			if (sources.length > selectedDisplayId) {
				const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
				const filename = `screenshot-${timestamp}.png`;
				const filepath = path.join(currentFolder, filename);

				const image = sources[selectedDisplayId].thumbnail;
				const pngBuffer = image.toPNG();

				fs.writeFileSync(filepath, pngBuffer);

				// Copiar para clipboard se habilitado
				if (copyToClipboard) {
					clipboard.writeImage(image);
				}

				mainWindow?.webContents.send('screenshot-captured', {
					filepath,
					filename,
				});

				// Anima o tray icon
				mainWindow?.webContents.send('trigger-screenshot-flash');
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
				const displays = screen.getAllDisplays();
				const display = displays[selectedDisplayId] || displays[0];
				const { width, height } = display.bounds;

				const sources = await desktopCapturer.getSources({
					types: ['screen'],
					thumbnailSize: { width, height },
				});

				if (sources.length > selectedDisplayId) {
					const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
					const filename = `screenshot-${timestamp}.png`;
					const filepath = path.join(currentFolder, filename);

					const image = sources[selectedDisplayId].thumbnail;
					const cropped = image.crop(savedArea);

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

	if (!ret || !retArea) {
		console.log('Falha ao registrar atalho global');
	}
}

app.whenReady().then(() => {
	createWindow();
	createTray();
	registerGlobalShortcut();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
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

// IPC Handlers
ipcMain.handle('select-folder', async () => {
	const result = await dialog.showOpenDialog({
		properties: ['openDirectory', 'createDirectory'],
	});

	if (!result.canceled && result.filePaths.length > 0) {
		currentFolder = result.filePaths[0];
		return currentFolder;
	}
	return null;
});

ipcMain.handle('create-folder', async (_, folderName: string) => {
	const result = await dialog.showOpenDialog({
		properties: ['openDirectory', 'createDirectory'],
		title: 'Selecione onde criar a pasta',
	});

	if (!result.canceled && result.filePaths.length > 0) {
		const newFolderPath = path.join(result.filePaths[0], folderName);
		if (!fs.existsSync(newFolderPath)) {
			fs.mkdirSync(newFolderPath, { recursive: true });
		}
		currentFolder = newFolderPath;
		return newFolderPath;
	}
	return null;
});

ipcMain.handle(
	'create-subfolder',
	async (_, parentPath: string, folderName: string) => {
		let newFolderPath = path.join(parentPath, folderName);

		// Se já existe, adiciona (2), (3), etc
		if (fs.existsSync(newFolderPath)) {
			let counter = 2;
			while (
				fs.existsSync(path.join(parentPath, `${folderName} (${counter})`))
			) {
				counter++;
			}
			newFolderPath = path.join(parentPath, `${folderName} (${counter})`);
		}

		if (!fs.existsSync(newFolderPath)) {
			fs.mkdirSync(newFolderPath, { recursive: true });
		}
		currentFolder = newFolderPath;
		return newFolderPath;
	},
);

ipcMain.handle('rename-folder', async (_, oldPath: string, newName: string) => {
	try {
		const parentPath = path.dirname(oldPath);
		let newPath = path.join(parentPath, newName);

		// Se já existe pasta com esse nome, adiciona (2), (3), etc
		if (fs.existsSync(newPath) && newPath !== oldPath) {
			let counter = 2;
			while (fs.existsSync(path.join(parentPath, `${newName} (${counter})`))) {
				counter++;
			}
			newPath = path.join(parentPath, `${newName} (${counter})`);
		}

		// Se a pasta antiga existe e o caminho mudou, renomeia
		if (fs.existsSync(oldPath) && oldPath !== newPath) {
			fs.renameSync(oldPath, newPath);
			currentFolder = newPath;
			return newPath;
		}

		// Se o caminho não mudou, retorna o atual
		return oldPath;
	} catch (error) {
		console.error('Error renaming folder:', error);
		return null;
	}
});

ipcMain.handle('get-images', async (_, folderPath: string) => {
	if (!fs.existsSync(folderPath)) {
		return [];
	}

	const files = fs.readdirSync(folderPath);
	const imageFiles = files.filter((file) =>
		/\.(png|jpg|jpeg|gif|webp)$/i.test(file),
	);

	return imageFiles.map((file) => ({
		name: file,
		path: path.join(folderPath, file),
	}));
});

ipcMain.handle('save-image', async (_, { filepath, dataUrl }) => {
	try {
		const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
		fs.writeFileSync(filepath, base64Data, 'base64');
		return true;
	} catch (error) {
		console.error('Error saving image:', error);
		return false;
	}
});

ipcMain.handle('delete-image', async (_, filepath: string) => {
	try {
		if (fs.existsSync(filepath)) {
			fs.unlinkSync(filepath);
			return true;
		}
		return false;
	} catch (error) {
		console.error('Error deleting image:', error);
		return false;
	}
});

// Get all displays
ipcMain.handle('get-displays', async () => {
	const displays = screen.getAllDisplays();
	return displays.map((display, index) => ({
		id: index,
		label: `Monitor ${index + 1} (${display.bounds.width}x${display.bounds.height})`,
		bounds: display.bounds,
		primary: display.id === screen.getPrimaryDisplay().id,
	}));
});

// Set selected display
ipcMain.handle('set-display', async (_, displayId: number) => {
	selectedDisplayId = displayId;
	return true;
});

ipcMain.handle('set-use-saved-area', async (_, useArea: boolean) => {
	useSavedArea = useArea;
	return true;
});

ipcMain.handle('set-copy-to-clipboard', async (_, enabled: boolean) => {
	copyToClipboard = enabled;
	return true;
});

ipcMain.handle('set-shortcut', async (_, newShortcut: string) => {
	shortcutKey = newShortcut;
	registerGlobalShortcut();
	return true;
});

ipcMain.handle('get-current-folder', async () => {
	return currentFolder;
});

ipcMain.handle('read-image-as-base64', async (_, filepath: string) => {
	try {
		const imageBuffer = fs.readFileSync(filepath);
		const base64 = imageBuffer.toString('base64');
		const ext = path.extname(filepath).toLowerCase();
		let mimeType = 'image/png';
		if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
		else if (ext === '.gif') mimeType = 'image/gif';
		else if (ext === '.webp') mimeType = 'image/webp';
		return `data:${mimeType};base64,${base64}`;
	} catch (error) {
		console.error('Error reading image:', error);
		return null;
	}
});

ipcMain.handle('set-area-shortcut', async (_, newShortcut: string) => {
	shortcutKeyArea = newShortcut;
	registerGlobalShortcut();
	return true;
});

ipcMain.handle(
	'save-selected-area',
	async (_, area: { x: number; y: number; width: number; height: number }) => {
		savedArea = area;
		return true;
	},
);

ipcMain.handle('get-saved-area', async () => {
	return savedArea;
});

ipcMain.handle('show-pdf-exists-dialog', async (_, { filename }) => {
	try {
		const result = await dialog.showMessageBox({
			type: 'question',
			title: 'Arquivo já existe',
			message: `Um arquivo PDF com este nome já existe:\n${filename}`,
			buttons: ['Substituir', 'Criar nova cópia', 'Cancelar'],
			defaultId: 1,
			cancelId: 2,
		});

		// result.response: 0 = Substituir, 1 = Criar nova cópia, 2 = Cancelar
		return { success: true, action: result.response };
	} catch (error) {
		console.error('Error showing dialog:', error);
		return { success: false, error: String(error) };
	}
});

ipcMain.handle('check-pdf-exists', async (_, { filename }) => {
	try {
		if (!currentFolder) {
			return { success: false, error: 'Nenhuma pasta selecionada' };
		}

		const filepath = path.join(currentFolder, filename);
		const exists = fs.existsSync(filepath);

		return { success: true, exists };
	} catch (error) {
		console.error('Error checking PDF:', error);
		return { success: false, error: String(error) };
	}
});

ipcMain.handle('find-next-filename', async (_, { baseFilename }) => {
	try {
		if (!currentFolder) {
			return { success: false, error: 'Nenhuma pasta selecionada' };
		}

		// Extrair nome e extensão
		const ext = path.extname(baseFilename);
		const nameWithoutExt = path.basename(baseFilename, ext);

		let counter = 2;
		let newFilename = baseFilename;
		let filepath = path.join(currentFolder, newFilename);

		// Encontrar próximo número disponível
		while (fs.existsSync(filepath)) {
			newFilename = `${nameWithoutExt} (${counter})${ext}`;
			filepath = path.join(currentFolder, newFilename);
			counter++;
		}

		return { success: true, filename: newFilename };
	} catch (error) {
		console.error('Error finding next filename:', error);
		return { success: false, error: String(error) };
	}
});

ipcMain.handle('save-pdf', async (_, { pdfData, filename }) => {
	try {
		if (!currentFolder) {
			return { success: false, error: 'Nenhuma pasta selecionada' };
		}

		const filepath = path.join(currentFolder, filename);
		const base64Data = pdfData.split(',')[1]; // Remove data:application/pdf;base64,
		fs.writeFileSync(filepath, base64Data, 'base64');

		return { success: true, filepath };
	} catch (error) {
		console.error('Error saving PDF:', error);
		return { success: false, error: String(error) };
	}
});

ipcMain.handle('show-pdf-saved-dialog', async (_, { filename }) => {
	try {
		const result = await dialog.showMessageBox(mainWindow!, {
			type: 'info',
			title: 'PDF Salvo',
			message: 'PDF salvo com sucesso!',
			detail: filename,
			buttons: ['OK', 'Visualizar PDF'],
			defaultId: 1,
			cancelId: 0,
		});

		return {
			action: result.response === 1 ? 'view' : 'ok',
		};
	} catch (error) {
		console.error('Error showing dialog:', error);
		return { action: 'ok' };
	}
});

ipcMain.handle('open-pdf', async (_, filepath) => {
	try {
		await shell.openPath(filepath);
		return { success: true };
	} catch (error) {
		console.error('Error opening PDF:', error);
		return { success: false, error: String(error) };
	}
});

ipcMain.handle('open-folder-in-finder', async (_, folderPath) => {
	try {
		await shell.openPath(folderPath);
		return { success: true };
	} catch (error) {
		console.error('Error opening folder:', error);
		return { success: false, error: String(error) };
	}
});

ipcMain.handle('save-header-data', async (_, folderPath, headerData) => {
	try {
		if (!folderPath) {
			return { success: false, error: 'Nenhuma pasta especificada' };
		}

		const configPath = path.join(folderPath, '.qabooster-config.json');
		fs.writeFileSync(configPath, JSON.stringify(headerData, null, 2), 'utf-8');

		return { success: true };
	} catch (error) {
		console.error('Error saving header data:', error);
		return { success: false, error: String(error) };
	}
});

ipcMain.handle('load-header-data', async (_, folderPath: string) => {
	try {
		const configPath = path.join(folderPath, '.qabooster-config.json');

		if (fs.existsSync(configPath)) {
			const data = fs.readFileSync(configPath, 'utf-8');
			const parsedData = JSON.parse(data);

			// Validação: se parsedData for string, arquivo está corrompido
			if (typeof parsedData === 'string') {
				fs.unlinkSync(configPath);
				return { success: false, error: 'Arquivo corrompido e removido' };
			}

			return { success: true, data: parsedData };
		}

		return { success: false, error: 'Config file not found' };
	} catch (error) {
		console.error('Error loading header data:', error);
		return { success: false, error: String(error) };
	}
});

// Notes management
ipcMain.handle('save-notes', async (_, folderPath: string, notesData: any) => {
	try {
		const notesPath = path.join(folderPath, '.qabooster-notes.json');
		fs.writeFileSync(notesPath, JSON.stringify(notesData, null, 2), 'utf-8');
		return { success: true };
	} catch (error) {
		console.error('Error saving notes:', error);
		return { success: false, error: String(error) };
	}
});

ipcMain.handle('load-notes', async (_, folderPath: string) => {
	try {
		const notesPath = path.join(folderPath, '.qabooster-notes.json');

		if (fs.existsSync(notesPath)) {
			const data = fs.readFileSync(notesPath, 'utf-8');
			return { success: true, data: JSON.parse(data) };
		}

		return { success: true, data: { text: '', images: [] } };
	} catch (error) {
		console.error('Error loading notes:', error);
		return { success: false, error: String(error) };
	}
});

ipcMain.handle('open-image-preview', async (_, imagePath: string) => {
	try {
		// Abre a imagem no visualizador padrão do sistema (Preview no Mac)
		await shell.openPath(imagePath);
		return { success: true };
	} catch (error) {
		console.error('Error opening image preview:', error);
		return { success: false, error: String(error) };
	}
});

// Função base para overlay de seleção de área
async function openAreaSelector(eventName: string, saveScreenshot: boolean) {
	if (overlayWindow) {
		overlayWindow.close();
		overlayWindow = null;
	}

	const displays = screen.getAllDisplays();
	const display = displays[selectedDisplayId] || displays[0];
	const { x, y, width, height } = display.bounds;

	// Captura screenshot ANTES de criar a janela
	const sources = await desktopCapturer.getSources({
		types: ['screen'],
		thumbnailSize: { width, height },
	});

	const screenshot = sources[selectedDisplayId].thumbnail;
	if (saveScreenshot) {
		pendingScreenshot = screenshot;
	}

	const screenshotDataURL = screenshot.toDataURL();

	// Cria overlay transparente sem animação
	overlayWindow = new BrowserWindow({
		x,
		y,
		width,
		height,
		frame: false,
		transparent: true,
		alwaysOnTop: true,
		skipTaskbar: true,
		resizable: false,
		movable: false,
		hasShadow: false,
		focusable: true,
		show: false,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	});

	// Não esconde a janela principal - apenas mostra o overlay por cima
	overlayWindow.setIgnoreMouseEvents(false);
	overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
	overlayWindow.setAlwaysOnTop(true, 'screen-saver');

	const htmlPath = path.join(__dirname, 'area-selector', 'area-selector.html');

	await overlayWindow.loadFile(htmlPath);

	// Injeta o screenshot e eventName
	await overlayWindow.webContents.executeJavaScript(`
		document.getElementById('screenshot').src = '${screenshotDataURL}';
		window.eventName = '${eventName}';
	`);

	// Mostra imediatamente sem ready-to-show para evitar animação
	overlayWindow.show();
	overlayWindow.focus();

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
		overlayWindow.close();
		overlayWindow = null;
	}

	// Salva o screenshot com crop da área
	if (pendingScreenshot && currentFolder) {
		try {
			const cropped = pendingScreenshot.crop(area);
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const filename = `screenshot-${timestamp}.png`;
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
		overlayWindow.close();
		overlayWindow = null;
	}

	mainWindow?.webContents.send('area-saved-with-confirmation', area);
});

ipcMain.on('area-selection-cancelled', () => {
	if (overlayWindow) {
		overlayWindow.close();
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
