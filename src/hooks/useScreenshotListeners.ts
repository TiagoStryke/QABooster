import { RefObject, useEffect } from 'react';
import { ImageData } from '../interfaces';
import { ipcService } from '../services/ipc-service';
import { playScreenshotSound } from './useAudioFeedback';

const { ipcRenderer } = window.require('electron');

interface UseScreenshotListenersParams {
	currentFolderRef: RefObject<string>;
	setCurrentFolder: (folder: string) => void;
	setImages: (images: ImageData[]) => void;
	t: (key: string) => string;
}

/**
 * Sets up IPC listeners for screenshot events
 * Handles screenshot captures, errors, and shortcut registration failures
 */
export function useScreenshotListeners({
	currentFolderRef,
	setCurrentFolder,
	setImages,
	t,
}: UseScreenshotListenersParams) {
	useEffect(() => {
		const handleScreenshotCaptured = () => {
			const folder = currentFolderRef.current;
			if (folder) {
				ipcService.getImages(folder).then(setImages);
			}
		};

		const handleFolderCreated = (
			_: any,
			data: { path: string; fromShortcut?: boolean },
		) => {
			console.log('[FRONTEND] 📥 folder-created event received:', data);
			// Backend criou a pasta, atualiza o frontend
			// Se fromShortcut = true, marca como pasta criada com dados (não limpar headers)
			if (data.fromShortcut) {
				console.log('[FRONTEND] 🎯 From shortcut - updating ref only');
				// Atualiza currentFolderRef diretamente (sem trigger do useEffect que limpa)
				currentFolderRef.current = data.path;
				// Força atualização via evento customizado
				window.dispatchEvent(
					new CustomEvent('folder-created-from-shortcut', {
						detail: { path: data.path },
					}),
				);
			} else {
				console.log('[FRONTEND] 📁 Manual selection - normal behavior');
				// Pasta selecionada manualmente - comportamento normal
				setCurrentFolder(data.path);
			}
		};

		const handleScreenshotFlash = () => {
			// Play sound feedback
			playScreenshotSound();

			// Animate tray icon
			ipcService.sendScreenshotFlash();
		};

		const handleScreenshotError = (_: any, message: string) => {
			alert(t('noFolderSelectedForScreenshot'));
		};

		const handleShortcutRegistrationFailed = (
			_: any,
			data: { shortcuts: Array<{ type: string; key: string }> },
		) => {
			const shortcutNames = data.shortcuts.map((s) => {
				const nameMap: Record<string, string> = {
					fullscreen: t('fullScreen'),
					area: t('area'),
					quick: t('quickPrint'),
				};
				return `${nameMap[s.type] || s.type} (${s.key})`;
			});

			const message = `${t('shortcutRegistrationFailedMessage')}\n${shortcutNames.join('\n')}\n\n${t('shortcutConflictHint')}`;
			alert(message);
		};

		// Register listeners
		ipcRenderer.on('screenshot-captured', handleScreenshotCaptured);
		ipcRenderer.on('folder-created', handleFolderCreated);
		ipcRenderer.on('trigger-screenshot-flash', handleScreenshotFlash);
		ipcRenderer.on('screenshot-error', handleScreenshotError);
		ipcRenderer.on(
			'shortcut-registration-failed',
			handleShortcutRegistrationFailed,
		);

		// Cleanup
		return () => {
			ipcRenderer.removeAllListeners('screenshot-captured');
			ipcRenderer.removeAllListeners('folder-created');
			ipcRenderer.removeAllListeners('screenshot-error');
			ipcRenderer.removeAllListeners('trigger-screenshot-flash');
			ipcRenderer.removeAllListeners('shortcut-registration-failed');
		};
	}, [currentFolderRef, setCurrentFolder, setImages, t]);
}
