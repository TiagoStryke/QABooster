import { RefObject, useEffect } from 'react';
import { ImageData } from '../interfaces';
import { playScreenshotSound } from './useAudioFeedback';

const { ipcRenderer } = window.require('electron');

interface UseScreenshotListenersParams {
	currentFolderRef: RefObject<string>;
	setImages: (images: ImageData[]) => void;
	t: (key: string) => string;
}

/**
 * Sets up IPC listeners for screenshot events
 * Handles screenshot captures, errors, and shortcut registration failures
 */
export function useScreenshotListeners({
	currentFolderRef,
	setImages,
	t,
}: UseScreenshotListenersParams) {
	useEffect(() => {
		const handleScreenshotCaptured = () => {
			const folder = currentFolderRef.current;
			if (folder) {
				ipcRenderer.invoke('get-images', folder).then(setImages);
			}
		};

		const handleScreenshotFlash = () => {
			// Play sound feedback
			playScreenshotSound();

			// Animate tray icon
			ipcRenderer.send('screenshot-flash');
		};

		const handleScreenshotError = (_: any, message: string) => {
			alert(t('errorGeneratingPDF'));
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
		ipcRenderer.on('trigger-screenshot-flash', handleScreenshotFlash);
		ipcRenderer.on('screenshot-error', handleScreenshotError);
		ipcRenderer.on(
			'shortcut-registration-failed',
			handleShortcutRegistrationFailed,
		);

		// Cleanup
		return () => {
			ipcRenderer.removeAllListeners('screenshot-captured');
			ipcRenderer.removeAllListeners('screenshot-error');
			ipcRenderer.removeAllListeners('trigger-screenshot-flash');
			ipcRenderer.removeAllListeners('shortcut-registration-failed');
		};
	}, [currentFolderRef, setImages, t]);
}
