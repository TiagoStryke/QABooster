import {
    app,
    BrowserWindow,
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
let savedArea: { x: number; y: number; width: number; height: number } | null =
	null;
let originalWindowWidth: number = 1400; // Largura original da janela
let pendingScreenshot: Electron.NativeImage | null = null; // Screenshot pendente para salvar

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
		mainWindow.webContents.openDevTools();
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

				const image = sources[selectedDisplayId].thumbnail.toPNG();
				fs.writeFileSync(filepath, image);

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

ipcMain.handle('save-header-data', async (_, headerData) => {
	try {
		if (!currentFolder) {
			return { success: false, error: 'Nenhuma pasta selecionada' };
		}

		const configPath = path.join(currentFolder, '.qabooster-config.json');
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
			return { success: true, data: JSON.parse(data) };
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

// Area selection overlay function - para TIRAR PRINT
async function openAreaSelectorForScreenshot() {
	console.log('🔵 [1] openAreaSelectorForScreenshot - INICIOU');
	if (overlayWindow) {
		console.log('🔵 [2] Fechando overlay anterior');
		overlayWindow.close();
	}

	console.log('🔵 [3] Obtendo displays');
	const displays = screen.getAllDisplays();
	const display = displays[selectedDisplayId] || displays[0];
	const { x, y, width, height } = display.bounds;

	// Captura screenshot ANTES de abrir overlay
	console.log('🔵 [4] CAPTURANDO SCREENSHOT - pode piscar branco aqui');
	const sources = await desktopCapturer.getSources({
		types: ['screen'],
		thumbnailSize: { width, height },
	});
	console.log('🔵 [5] Screenshot capturado');

	const fullScreenshot = sources[selectedDisplayId].thumbnail;
	pendingScreenshot = fullScreenshot; // Guarda para salvar depois
	const screenshotDataURL = fullScreenshot.toDataURL();
	console.log('🔵 [6] Screenshot convertido para DataURL');

	console.log('🔵 [7] CRIANDO BROWSERWINDOW - pode piscar branco aqui');
	overlayWindow = new BrowserWindow({
		x,
		y,
		width,
		height,
		frame: false,
		transparent: false,
		alwaysOnTop: true,
		skipTaskbar: true,
		resizable: false,
		movable: false,
		fullscreen: true,
		show: false,
		paintWhenInitiallyHidden: true,
		backgroundColor: '#000000',
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			backgroundThrottling: false,
		},
	});
	console.log('🔵 [8] BrowserWindow criada');

	overlayWindow.once('ready-to-show', () => {
		console.log('🔵 [9] ready-to-show DISPAROU');
		if (mainWindow) {
			console.log('🔵 [10] ESCONDENDO mainWindow');
			mainWindow.hide(); // Esconde imediatamente sem animação
		}
		console.log('🔵 [11] MOSTRANDO overlayWindow com showInactive');
		overlayWindow?.showInactive(); // Mostra sem animação e sem focus
		setTimeout(() => {
			console.log('🔵 [12] Dando focus no overlay');
			overlayWindow?.focus();
		}, 50); // Dá focus depois
	});

	const overlayHTML = `
<!DOCTYPE html>
<html>
<head>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body { 
			cursor: crosshair; 
			overflow: hidden;
			background: #000;
			width: 100vw;
			height: 100vh;
			position: relative;
		}
		#screenshot {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			object-fit: fill;
			user-select: none;
			pointer-events: none;
		}
		#selection {
			position: absolute;
			border: 3px solid #3b82f6;
			background: transparent;
			display: none;
			box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4);
			cursor: move;
		}
		.resize-handle {
			position: absolute;
			width: 12px;
			height: 12px;
			background: #3b82f6;
			border: 2px solid white;
			border-radius: 50%;
			display: none;
		}
		.handle-tl { top: -6px; left: -6px; cursor: nwse-resize; }
		.handle-tr { top: -6px; right: -6px; cursor: nesw-resize; }
		.handle-bl { bottom: -6px; left: -6px; cursor: nesw-resize; }
		.handle-br { bottom: -6px; right: -6px; cursor: nwse-resize; }
		.handle-t { top: -6px; left: 50%; margin-left: -6px; cursor: ns-resize; }
		.handle-b { bottom: -6px; left: 50%; margin-left: -6px; cursor: ns-resize; }
		.handle-l { left: -6px; top: 50%; margin-top: -6px; cursor: ew-resize; }
		.handle-r { right: -6px; top: 50%; margin-top: -6px; cursor: ew-resize; }
		#confirmBtn {
			position: absolute;
			bottom: -40px;
			right: 0;
			background: #3b82f6;
			color: white;
			border: none;
			padding: 8px 16px;
			border-radius: 6px;
			cursor: pointer;
			font-family: system-ui;
			font-size: 13px;
			font-weight: 500;
			display: none;
			box-shadow: 0 2px 8px rgba(0,0,0,0.5);
		}
		#confirmBtn:hover {
			background: #2563eb;
		}
		#info {
			position: fixed;
			top: 20px;
			left: 50%;
			transform: translateX(-50%);
			background: rgba(0, 0, 0, 0.85);
			color: white;
			padding: 12px 24px;
			border-radius: 8px;
			font-family: system-ui;
			font-size: 14px;
			z-index: 10000;
			box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5);
		}
	</style>
</head>
<body>
	<img id="screenshot" src="${screenshotDataURL}" />
	<div id="info">Clique e arraste para selecionar a área • ESC para cancelar</div>
	<div id="selection">
		<div class="resize-handle handle-tl"></div>
		<div class="resize-handle handle-tr"></div>
		<div class="resize-handle handle-bl"></div>
		<div class="resize-handle handle-br"></div>
		<div class="resize-handle handle-t"></div>
		<div class="resize-handle handle-b"></div>
		<div class="resize-handle handle-l"></div>
		<div class="resize-handle handle-r"></div>
		<button id="confirmBtn">OK</button>
	</div>
	<script>
		const { ipcRenderer } = require('electron');
		
		let startX, startY;
		let isDrawing = false;
		let isResizing = false;
		let isDragging = false;
		let resizeHandle = null;
		let dragStartX, dragStartY, selectionStartX, selectionStartY;
		
		const selection = document.getElementById('selection');
		const confirmBtn = document.getElementById('confirmBtn');
		const handles = document.querySelectorAll('.resize-handle');
		const info = document.getElementById('info');
		
		// Desenhar seleção inicial
		document.addEventListener('mousedown', (e) => {
			if (e.target.classList.contains('resize-handle')) {
				isResizing = true;
				resizeHandle = e.target;
				e.stopPropagation();
				return;
			}
			
			if (e.target === confirmBtn) {
				return;
			}
			
			if (e.target === selection) {
				isDragging = true;
				dragStartX = e.clientX;
				dragStartY = e.clientY;
				selectionStartX = parseInt(selection.style.left);
				selectionStartY = parseInt(selection.style.top);
				e.stopPropagation();
				return;
			}
			
			if (selection.style.display === 'block') return;
			
			startX = e.clientX;
			startY = e.clientY;
			isDrawing = true;
			selection.style.left = startX + 'px';
			selection.style.top = startY + 'px';
			selection.style.width = '0px';
			selection.style.height = '0px';
			selection.style.display = 'block';
		});
		
		document.addEventListener('mousemove', (e) => {
			if (isResizing && resizeHandle) {
				const rect = {
					left: parseInt(selection.style.left),
					top: parseInt(selection.style.top),
					width: parseInt(selection.style.width),
					height: parseInt(selection.style.height)
				};
				
				const handle = resizeHandle.classList;
				
				if (handle.contains('handle-br')) {
					selection.style.width = Math.max(20, e.clientX - rect.left) + 'px';
					selection.style.height = Math.max(20, e.clientY - rect.top) + 'px';
				} else if (handle.contains('handle-bl')) {
					const newWidth = Math.max(20, rect.left + rect.width - e.clientX);
					selection.style.left = (rect.left + rect.width - newWidth) + 'px';
					selection.style.width = newWidth + 'px';
					selection.style.height = Math.max(20, e.clientY - rect.top) + 'px';
				} else if (handle.contains('handle-tr')) {
					selection.style.width = Math.max(20, e.clientX - rect.left) + 'px';
					const newHeight = Math.max(20, rect.top + rect.height - e.clientY);
					selection.style.top = (rect.top + rect.height - newHeight) + 'px';
					selection.style.height = newHeight + 'px';
				} else if (handle.contains('handle-tl')) {
					const newWidth = Math.max(20, rect.left + rect.width - e.clientX);
					const newHeight = Math.max(20, rect.top + rect.height - e.clientY);
					selection.style.left = (rect.left + rect.width - newWidth) + 'px';
					selection.style.top = (rect.top + rect.height - newHeight) + 'px';
					selection.style.width = newWidth + 'px';
					selection.style.height = newHeight + 'px';
				} else if (handle.contains('handle-t')) {
					const newHeight = Math.max(20, rect.top + rect.height - e.clientY);
					selection.style.top = (rect.top + rect.height - newHeight) + 'px';
					selection.style.height = newHeight + 'px';
				} else if (handle.contains('handle-b')) {
					selection.style.height = Math.max(20, e.clientY - rect.top) + 'px';
				} else if (handle.contains('handle-l')) {
					const newWidth = Math.max(20, rect.left + rect.width - e.clientX);
					selection.style.left = (rect.left + rect.width - newWidth) + 'px';
					selection.style.width = newWidth + 'px';
				} else if (handle.contains('handle-r')) {
					selection.style.width = Math.max(20, e.clientX - rect.left) + 'px';
				}
				return;
			}
			
			if (isDragging) {
				const deltaX = e.clientX - dragStartX;
				const deltaY = e.clientY - dragStartY;
				selection.style.left = (selectionStartX + deltaX) + 'px';
				selection.style.top = (selectionStartY + deltaY) + 'px';
				return;
			}
			
			if (!isDrawing) return;
			
			const currentX = e.clientX;
			const currentY = e.clientY;
			
			const width = Math.abs(currentX - startX);
			const height = Math.abs(currentY - startY);
			const left = Math.min(startX, currentX);
			const top = Math.min(startY, currentY);
			
			selection.style.left = left + 'px';
			selection.style.top = top + 'px';
			selection.style.width = width + 'px';
			selection.style.height = height + 'px';
		});
		
		document.addEventListener('mouseup', (e) => {
			if (isDrawing) {
				isDrawing = false;
				const width = parseInt(selection.style.width);
				const height = parseInt(selection.style.height);
				
				if (width > 10 && height > 10) {
					// Mostra handles e botão OK
					handles.forEach(h => h.style.display = 'block');
					confirmBtn.style.display = 'block';
					info.textContent = 'Ajuste a seleção • Clique OK para confirmar • ESC para cancelar';
				} else {
					selection.style.display = 'none';
				}
			}
			
			isResizing = false;
			isDragging = false;
			resizeHandle = null;
		});
		
		confirmBtn.addEventListener('click', () => {
			const x = parseInt(selection.style.left);
			const y = parseInt(selection.style.top);
			const width = parseInt(selection.style.width);
			const height = parseInt(selection.style.height);
			
			ipcRenderer.send('area-selected-for-screenshot', { x, y, width, height });
			window.close();
		});
		
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				ipcRenderer.send('area-selection-cancelled');
				window.close();
			}
		});
	</script>
</body>
</html>
	`;

	overlayWindow.loadURL(
		`data:text/html;charset=utf-8,${encodeURIComponent(overlayHTML)}`,
	);
	overlayWindow.setFullScreen(true);

	overlayWindow.on('closed', () => {
		overlayWindow = null;
		pendingScreenshot = null;
		if (mainWindow && !mainWindow.isVisible()) {
			mainWindow.show();
		}
	});
}

// Area selection overlay function - SÓ PARA SELECIONAR ÁREA (botão)
async function openAreaSelectorOnly() {
	if (overlayWindow) {
		overlayWindow.close();
	}

	const displays = screen.getAllDisplays();
	const display = displays[selectedDisplayId] || displays[0];
	const { x, y, width, height } = display.bounds;

	// Captura screenshot só para mostrar (não vai salvar)
	const sources = await desktopCapturer.getSources({
		types: ['screen'],
		thumbnailSize: { width, height },
	});

	const screenshotDataURL = sources[selectedDisplayId].thumbnail.toDataURL();

	overlayWindow = new BrowserWindow({
		x,
		y,
		width,
		height,
		frame: false,
		transparent: false,
		alwaysOnTop: true,
		skipTaskbar: true,
		resizable: false,
		movable: false,
		fullscreen: true,
		show: false,
		paintWhenInitiallyHidden: true,
		backgroundColor: '#000000',
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			backgroundThrottling: false,
		},
	});

	overlayWindow.once('ready-to-show', () => {
		if (mainWindow) {
			mainWindow.hide();
		}
		overlayWindow?.showInactive();
		setTimeout(() => overlayWindow?.focus(), 50);
	});

	// Usa o mesmo HTML mas muda o evento para 'area-selected-only'
	const overlayHTML = `
<!DOCTYPE html>
<html>
<head>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body { 
			cursor: crosshair; 
			overflow: hidden;
			background: #000;
			width: 100vw;
			height: 100vh;
			position: relative;
		}
		#screenshot {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			object-fit: fill;
			user-select: none;
			pointer-events: none;
		}
		#selection {
			position: absolute;
			border: 3px solid #3b82f6;
			background: transparent;
			display: none;
			box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4);
			cursor: move;
		}
		.resize-handle {
			position: absolute;
			width: 12px;
			height: 12px;
			background: #3b82f6;
			border: 2px solid white;
			border-radius: 50%;
			display: none;
		}
		.handle-tl { top: -6px; left: -6px; cursor: nwse-resize; }
		.handle-tr { top: -6px; right: -6px; cursor: nesw-resize; }
		.handle-bl { bottom: -6px; left: -6px; cursor: nesw-resize; }
		.handle-br { bottom: -6px; right: -6px; cursor: nwse-resize; }
		.handle-t { top: -6px; left: 50%; margin-left: -6px; cursor: ns-resize; }
		.handle-b { bottom: -6px; left: 50%; margin-left: -6px; cursor: ns-resize; }
		.handle-l { left: -6px; top: 50%; margin-top: -6px; cursor: ew-resize; }
		.handle-r { right: -6px; top: 50%; margin-top: -6px; cursor: ew-resize; }
		#confirmBtn {
			position: absolute;
			bottom: -40px;
			right: 0;
			background: #3b82f6;
			color: white;
			border: none;
			padding: 8px 16px;
			border-radius: 6px;
			cursor: pointer;
			font-family: system-ui;
			font-size: 13px;
			font-weight: 500;
			display: none;
			box-shadow: 0 2px 8px rgba(0,0,0,0.5);
		}
		#confirmBtn:hover {
			background: #2563eb;
		}
		#info {
			position: fixed;
			top: 20px;
			left: 50%;
			transform: translateX(-50%);
			background: rgba(0, 0, 0, 0.85);
			color: white;
			padding: 12px 24px;
			border-radius: 8px;
			font-family: system-ui;
			font-size: 14px;
			z-index: 10000;
			box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5);
		}
	</style>
</head>
<body>
	<img id="screenshot" src="${screenshotDataURL}" />
	<div id="info">Clique e arraste para selecionar a área • ESC para cancelar</div>
	<div id="selection">
		<div class="resize-handle handle-tl"></div>
		<div class="resize-handle handle-tr"></div>
		<div class="resize-handle handle-bl"></div>
		<div class="resize-handle handle-br"></div>
		<div class="resize-handle handle-t"></div>
		<div class="resize-handle handle-b"></div>
		<div class="resize-handle handle-l"></div>
		<div class="resize-handle handle-r"></div>
		<button id="confirmBtn">OK</button>
	</div>
	<script>
		const { ipcRenderer } = require('electron');
		
		let startX, startY;
		let isDrawing = false;
		let isResizing = false;
		let isDragging = false;
		let resizeHandle = null;
		let dragStartX, dragStartY, selectionStartX, selectionStartY;
		
		const selection = document.getElementById('selection');
		const confirmBtn = document.getElementById('confirmBtn');
		const handles = document.querySelectorAll('.resize-handle');
		const info = document.getElementById('info');
		
		// Mesmo código de desenho e redimensionamento...
		document.addEventListener('mousedown', (e) => {
			if (e.target.classList.contains('resize-handle')) {
				isResizing = true;
				resizeHandle = e.target;
				e.stopPropagation();
				return;
			}
			
			if (e.target === confirmBtn) {
				return;
			}
			
			if (e.target === selection) {
				isDragging = true;
				dragStartX = e.clientX;
				dragStartY = e.clientY;
				selectionStartX = parseInt(selection.style.left);
				selectionStartY = parseInt(selection.style.top);
				e.stopPropagation();
				return;
			}
			
			if (selection.style.display === 'block') return;
			
			startX = e.clientX;
			startY = e.clientY;
			isDrawing = true;
			selection.style.left = startX + 'px';
			selection.style.top = startY + 'px';
			selection.style.width = '0px';
			selection.style.height = '0px';
			selection.style.display = 'block';
		});
		
		document.addEventListener('mousemove', (e) => {
			if (isResizing && resizeHandle) {
				const rect = {
					left: parseInt(selection.style.left),
					top: parseInt(selection.style.top),
					width: parseInt(selection.style.width),
					height: parseInt(selection.style.height)
				};
				
				const handle = resizeHandle.classList;
				
				if (handle.contains('handle-br')) {
					selection.style.width = Math.max(20, e.clientX - rect.left) + 'px';
					selection.style.height = Math.max(20, e.clientY - rect.top) + 'px';
				} else if (handle.contains('handle-bl')) {
					const newWidth = Math.max(20, rect.left + rect.width - e.clientX);
					selection.style.left = (rect.left + rect.width - newWidth) + 'px';
					selection.style.width = newWidth + 'px';
					selection.style.height = Math.max(20, e.clientY - rect.top) + 'px';
				} else if (handle.contains('handle-tr')) {
					selection.style.width = Math.max(20, e.clientX - rect.left) + 'px';
					const newHeight = Math.max(20, rect.top + rect.height - e.clientY);
					selection.style.top = (rect.top + rect.height - newHeight) + 'px';
					selection.style.height = newHeight + 'px';
				} else if (handle.contains('handle-tl')) {
					const newWidth = Math.max(20, rect.left + rect.width - e.clientX);
					const newHeight = Math.max(20, rect.top + rect.height - e.clientY);
					selection.style.left = (rect.left + rect.width - newWidth) + 'px';
					selection.style.top = (rect.top + rect.height - newHeight) + 'px';
					selection.style.width = newWidth + 'px';
					selection.style.height = newHeight + 'px';
				} else if (handle.contains('handle-t')) {
					const newHeight = Math.max(20, rect.top + rect.height - e.clientY);
					selection.style.top = (rect.top + rect.height - newHeight) + 'px';
					selection.style.height = newHeight + 'px';
				} else if (handle.contains('handle-b')) {
					selection.style.height = Math.max(20, e.clientY - rect.top) + 'px';
				} else if (handle.contains('handle-l')) {
					const newWidth = Math.max(20, rect.left + rect.width - e.clientX);
					selection.style.left = (rect.left + rect.width - newWidth) + 'px';
					selection.style.width = newWidth + 'px';
				} else if (handle.contains('handle-r')) {
					selection.style.width = Math.max(20, e.clientX - rect.left) + 'px';
				}
				return;
			}
			
			if (isDragging) {
				const deltaX = e.clientX - dragStartX;
				const deltaY = e.clientY - dragStartY;
				selection.style.left = (selectionStartX + deltaX) + 'px';
				selection.style.top = (selectionStartY + deltaY) + 'px';
				return;
			}
			
			if (!isDrawing) return;
			
			const currentX = e.clientX;
			const currentY = e.clientY;
			
			const width = Math.abs(currentX - startX);
			const height = Math.abs(currentY - startY);
			const left = Math.min(startX, currentX);
			const top = Math.min(startY, currentY);
			
			selection.style.left = left + 'px';
			selection.style.top = top + 'px';
			selection.style.width = width + 'px';
			selection.style.height = height + 'px';
		});
		
		document.addEventListener('mouseup', (e) => {
			if (isDrawing) {
				isDrawing = false;
				const width = parseInt(selection.style.width);
				const height = parseInt(selection.style.height);
				
				if (width > 10 && height > 10) {
					handles.forEach(h => h.style.display = 'block');
					confirmBtn.style.display = 'block';
					info.textContent = 'Ajuste a seleção • Clique OK para confirmar • ESC para cancelar';
				} else {
					selection.style.display = 'none';
				}
			}
			
			isResizing = false;
			isDragging = false;
			resizeHandle = null;
		});
		
		confirmBtn.addEventListener('click', () => {
			const x = parseInt(selection.style.left);
			const y = parseInt(selection.style.top);
			const width = parseInt(selection.style.width);
			const height = parseInt(selection.style.height);
			
			ipcRenderer.send('area-selected-only', { x, y, width, height });
			window.close();
		});
		
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				ipcRenderer.send('area-selection-cancelled');
				window.close();
			}
		});
	</script>
</body>
</html>
	`;

	overlayWindow.loadURL(
		`data:text/html;charset=utf-8,${encodeURIComponent(overlayHTML)}`,
	);
	overlayWindow.setFullScreen(true);

	overlayWindow.on('closed', () => {
		overlayWindow = null;
		if (mainWindow && !mainWindow.isVisible()) {
			mainWindow.show();
		}
	});
}

// IPC handler to open area selector
ipcMain.handle('open-area-selector', async () => {
	await openAreaSelectorOnly();
	return { success: true };
});

// Handler para quando área é selecionada PARA SCREENSHOT
ipcMain.on('area-selected-for-screenshot', (_, area) => {
	savedArea = area;

	// Salva o screenshot com crop da área
	if (pendingScreenshot && currentFolder) {
		try {
			const cropped = pendingScreenshot.crop(area);
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const filename = `screenshot-${timestamp}.png`;
			const filepath = path.join(currentFolder, filename);

			fs.writeFileSync(filepath, cropped.toPNG());

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
	mainWindow?.webContents.send('area-saved-with-confirmation', area);
});

ipcMain.on('area-selection-cancelled', () => {
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
