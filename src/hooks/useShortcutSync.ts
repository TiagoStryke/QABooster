import { useEffect } from 'react';
import { ipcService } from '../services/ipc-service';

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
		ipcService.setShortcut(shortcutFull);
		ipcService.setAreaShortcut(shortcutArea);
		ipcService.setQuickShortcut(shortcutQuick);
	}, []);
}
