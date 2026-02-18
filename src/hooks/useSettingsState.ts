/**
 * useSettingsState Hook
 *
 * Gerencia todos os estados e handlers do modal de configurações
 */

import { useEffect, useState } from 'react';
import { ipcService } from '../services/ipc-service';

export type Theme = 'blue' | 'dark' | 'grey' | 'rose' | 'light' | 'green';
export type Language = 'pt' | 'en';
export type ShortcutType = 'full' | 'area' | 'quick';

export function useSettingsState() {
	// ==================== BASIC SETTINGS ====================

	const [pdfOrientation, setPdfOrientation] = useState<
		'portrait' | 'landscape'
	>(
		(localStorage.getItem('qabooster-pdf-orientation') as
			| 'portrait'
			| 'landscape') || 'landscape',
	);

	const [theme, setTheme] = useState<Theme>(
		(localStorage.getItem('qabooster-theme') as Theme) || 'blue',
	);

	const [language, setLanguage] = useState<Language>(
		(localStorage.getItem('qabooster-language') as Language) || 'pt',
	);

	const [copyToClipboard, setCopyToClipboard] = useState<boolean>(
		localStorage.getItem('qabooster-copy-to-clipboard') === 'true',
	);

	const [soundEnabled, setSoundEnabled] = useState<boolean>(
		localStorage.getItem('qabooster-sound') !== 'false',
	);

	const [cursorInScreenshots, setCursorInScreenshots] = useState<boolean>(
		localStorage.getItem('qabooster-cursor-in-screenshots') !== 'false',
	);

	// ==================== CLEANUP SETTINGS ====================

	const [autoDeleteAfterDays, setAutoDeleteAfterDays] = useState<number>(
		parseInt(localStorage.getItem('qabooster-auto-delete-days') || '0', 10),
	);

	const [cleanupInProgress, setCleanupInProgress] = useState(false);

	// ==================== KEYBOARD SHORTCUTS ====================

	const [shortcutFull, setShortcutFull] = useState(
		localStorage.getItem('qabooster-shortcut') || 'CommandOrControl+Shift+S',
	);

	const [shortcutArea, setShortcutArea] = useState(
		localStorage.getItem('qabooster-shortcut-area') ||
			'CommandOrControl+Shift+A',
	);

	const [shortcutQuick, setShortcutQuick] = useState(
		localStorage.getItem('qabooster-shortcut-quick') ||
			'CommandOrControl+Shift+Q',
	);

	const [editingShortcut, setEditingShortcut] = useState<ShortcutType | null>(
		null,
	);
	const [tempShortcut, setTempShortcut] = useState('');

	// ==================== INITIALIZATION ====================

	// Enviar preferência de clipboard ao montar
	useEffect(() => {
		ipcService.setCopyToClipboard(copyToClipboard);
	}, []);

	// ==================== HANDLERS - BASIC SETTINGS ====================

	const handlePdfOrientationChange = (
		orientation: 'portrait' | 'landscape',
	) => {
		setPdfOrientation(orientation);
		localStorage.setItem('qabooster-pdf-orientation', orientation);
		window.dispatchEvent(
			new CustomEvent('pdf-orientation-changed', { detail: orientation }),
		);
	};

	const handleThemeChange = (newTheme: Theme) => {
		setTheme(newTheme);
		localStorage.setItem('qabooster-theme', newTheme);
		window.dispatchEvent(
			new CustomEvent('theme-changed', { detail: newTheme }),
		);
	};

	const handleLanguageChange = (newLanguage: Language) => {
		setLanguage(newLanguage);
		localStorage.setItem('qabooster-language', newLanguage);
		window.dispatchEvent(
			new CustomEvent('language-changed', { detail: newLanguage }),
		);
	};

	const handleCopyToClipboardChange = (enabled: boolean) => {
		setCopyToClipboard(enabled);
		localStorage.setItem('qabooster-copy-to-clipboard', enabled.toString());
		ipcService.setCopyToClipboard(enabled);
	};

	const handleSoundEnabledChange = (enabled: boolean) => {
		setSoundEnabled(enabled);
		localStorage.setItem('qabooster-sound', enabled.toString());
		ipcService.setSoundEnabled(enabled);
	};

	const handleCursorInScreenshotsChange = (enabled: boolean) => {
		setCursorInScreenshots(enabled);
		localStorage.setItem('qabooster-cursor-in-screenshots', enabled.toString());
		ipcService.setCursorInScreenshots(enabled);
	};

	// ==================== HANDLERS - CLEANUP ====================

	const handleAutoDeleteDaysChange = async (days: number) => {
		setAutoDeleteAfterDays(days);
		localStorage.setItem('qabooster-auto-delete-days', days.toString());
		await ipcService.updateDatabaseSettings({
			autoDeleteAfterDays: days === 0 ? null : days,
		});
	};

	const handleCleanupNow = async () => {
		if (autoDeleteAfterDays === 0) return null;

		setCleanupInProgress(true);
		try {
			const result = await ipcService.cleanupOldTests();
			return result;
		} finally {
			setCleanupInProgress(false);
		}
	};

	/**
	 * Mark a test as old (for testing cleanup)
	 * @param testId - Test UUID
	 * @param daysAgo - How many days ago (default: 100)
	 */
	const handleMarkTestAsOld = async (testId: string, daysAgo: number = 100) => {
		try {
			const success = await ipcService.markTestAsOld(testId, daysAgo);
			return success;
		} catch (error) {
			console.error('Error marking test as old:', error);
			return false;
		}
	};

	// ==================== HANDLERS - SHORTCUTS ====================

	const handleShortcutEdit = (type: ShortcutType) => {
		const current =
			type === 'full'
				? shortcutFull
				: type === 'area'
					? shortcutArea
					: shortcutQuick;
		setTempShortcut(current);
		setEditingShortcut(type);
	};

	const handleShortcutSave = async () => {
		if (!tempShortcut || !editingShortcut) return;

		if (editingShortcut === 'full') {
			setShortcutFull(tempShortcut);
			localStorage.setItem('qabooster-shortcut', tempShortcut);
			await ipcService.setShortcut(tempShortcut);
		} else if (editingShortcut === 'area') {
			setShortcutArea(tempShortcut);
			localStorage.setItem('qabooster-shortcut-area', tempShortcut);
			await ipcService.setAreaShortcut(tempShortcut);
		} else if (editingShortcut === 'quick') {
			setShortcutQuick(tempShortcut);
			localStorage.setItem('qabooster-shortcut-quick', tempShortcut);
			await ipcService.setQuickShortcut(tempShortcut);
		}

		setEditingShortcut(null);
		setTempShortcut('');
	};

	const handleShortcutCancel = () => {
		setEditingShortcut(null);
		setTempShortcut('');
	};

	const handleShortcutKeyDown = (e: React.KeyboardEvent) => {
		e.preventDefault();
		if (e.key === 'Escape') {
			handleShortcutCancel();
			return;
		}
		if (e.key === 'Enter') {
			handleShortcutSave();
			return;
		}

		const keys = [];
		if (e.metaKey) keys.push('Cmd');
		if (e.ctrlKey) keys.push('Ctrl');
		if (e.altKey) keys.push('Alt');
		if (e.shiftKey) keys.push('Shift');
		if (e.key && !['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)) {
			keys.push(e.key.toUpperCase());
		}
		if (keys.length > 0) {
			setTempShortcut(keys.join('+'));
		}
	};

	// ==================== RETURN ====================

	return {
		// Basic settings
		pdfOrientation,
		theme,
		language,
		copyToClipboard,
		soundEnabled,
		cursorInScreenshots,

		// Basic settings handlers
		handlePdfOrientationChange,
		handleThemeChange,
		handleLanguageChange,
		handleCopyToClipboardChange,
		handleSoundEnabledChange,
		handleCursorInScreenshotsChange,

		// Cleanup settings
		autoDeleteAfterDays,
		cleanupInProgress,

		// Cleanup handlers
		handleAutoDeleteDaysChange,
		handleCleanupNow,
		handleMarkTestAsOld,

		// Shortcuts
		shortcutFull,
		shortcutArea,
		shortcutQuick,
		editingShortcut,
		tempShortcut,

		// Shortcuts handlers
		handleShortcutEdit,
		handleShortcutSave,
		handleShortcutCancel,
		handleShortcutKeyDown,
	};
}
