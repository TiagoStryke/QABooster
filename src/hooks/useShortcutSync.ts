import { useEffect } from 'react';

const { ipcRenderer } = window.require('electron');

/**
 * Synchronizes custom shortcuts from localStorage with backend on app initialization
 * Ensures user's saved shortcuts are registered immediately when app starts
 */
export function useShortcutSync() {
	useEffect(() => {
		// Load shortcuts from localStorage
		const shortcutFull =
			localStorage.getItem('qabooster-shortcut') || 'CommandOrControl+Shift+S';
		const shortcutArea =
			localStorage.getItem('qabooster-shortcut-area') ||
			'CommandOrControl+Shift+A';
		const shortcutQuick =
			localStorage.getItem('qabooster-shortcut-quick') ||
			'CommandOrControl+Shift+Q';

		// Send to backend to register global shortcuts
		ipcRenderer.invoke('set-shortcut', shortcutFull);
		ipcRenderer.invoke('set-area-shortcut', shortcutArea);
		ipcRenderer.invoke('set-quick-shortcut', shortcutQuick);
	}, []);
}
