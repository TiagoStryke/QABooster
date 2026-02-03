import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const { ipcRenderer } = window.require('electron');

interface SettingsProps {
	isOpen: boolean;
	onClose: () => void;
}

export type Theme = 'blue' | 'dark' | 'grey' | 'rose' | 'light' | 'green';
export type Language = 'pt' | 'en';

export default function Settings({ isOpen, onClose }: SettingsProps) {
	const { t } = useLanguage();
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

	// Keyboard shortcuts states
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
	const [editingShortcut, setEditingShortcut] = useState<
		'full' | 'area' | 'quick' | null
	>(null);
	const [tempShortcut, setTempShortcut] = useState('');

	// Enviar preferência de clipboard para o main process ao montar
	useEffect(() => {
		ipcRenderer.invoke('set-copy-to-clipboard', copyToClipboard);
	}, []);

	useEffect(() => {
		if (isOpen) {
			const handleClickOutside = (e: MouseEvent) => {
				const target = e.target as HTMLElement;
				if (!target.closest('.settings-modal-content')) {
					onClose();
				}
			};
			// Delay para não capturar o clique que abriu o modal
			const timerId = setTimeout(() => {
				document.addEventListener('click', handleClickOutside);
			}, 100);

			return () => {
				clearTimeout(timerId);
				document.removeEventListener('click', handleClickOutside);
			};
		}
	}, [isOpen, onClose]);

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
		ipcRenderer.invoke('set-copy-to-clipboard', enabled);
	};

	const handleSoundEnabledChange = (enabled: boolean) => {
		setSoundEnabled(enabled);
		localStorage.setItem('qabooster-sound', enabled.toString());
		ipcRenderer.invoke('set-sound-enabled', enabled);
	};

	const handleCursorInScreenshotsChange = (enabled: boolean) => {
		setCursorInScreenshots(enabled);
		localStorage.setItem('qabooster-cursor-in-screenshots', enabled.toString());
		ipcRenderer.invoke('set-cursor-in-screenshots', enabled);
	};

	const handleShortcutEdit = (type: 'full' | 'area' | 'quick') => {
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
			await ipcRenderer.invoke('set-shortcut', tempShortcut);
		} else if (editingShortcut === 'area') {
			setShortcutArea(tempShortcut);
			localStorage.setItem('qabooster-shortcut-area', tempShortcut);
			await ipcRenderer.invoke('set-area-shortcut', tempShortcut);
		} else if (editingShortcut === 'quick') {
			setShortcutQuick(tempShortcut);
			localStorage.setItem('qabooster-shortcut-quick', tempShortcut);
			await ipcRenderer.invoke('set-quick-shortcut', tempShortcut);
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

	if (!isOpen) return null;

	const themes = [
		{ id: 'blue' as Theme, name: t('themeBlue') },
		{ id: 'dark' as Theme, name: t('themeDark') },
		{ id: 'grey' as Theme, name: t('themeGrey') },
		{ id: 'rose' as Theme, name: t('themeRose') },
		{ id: 'light' as Theme, name: t('themeLight') },
		{ id: 'green' as Theme, name: t('themeGreen') },
	];

	return (
		<div
			className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
			style={{ WebkitAppRegion: 'no-drag' } as any}
		>
			<div
				className="settings-modal-content bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-[500px] max-h-[80vh] overflow-y-auto"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="p-6">
					{/* Header */}
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-xl font-bold text-slate-100">
							{t('settings')}
						</h2>
						<button
							onClick={onClose}
							className="text-slate-400 hover:text-slate-200 transition-colors"
						>
							<svg
								className="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>

					{/* Orientação do PDF */}
					<div className="mb-4">
						<label className="block text-sm font-semibold text-slate-300 mb-2">
							{t('pdfOrientation')}
						</label>
						<select
							value={pdfOrientation}
							onChange={(e) =>
								handlePdfOrientationChange(
									e.target.value as 'portrait' | 'landscape',
								)
							}
							className="settings-dropdown w-full rounded px-3 py-2 border focus:outline-none focus:ring-2"
						>
							<option value="portrait">{t('portrait')}</option>
							<option value="landscape">{t('landscape')}</option>
						</select>
					</div>

					{/* Idioma */}
					<div className="mb-4">
						<label className="block text-sm font-semibold text-slate-300 mb-2">
							{t('language')}
						</label>
						<select
							value={language}
							onChange={(e) => handleLanguageChange(e.target.value as Language)}
							className="settings-dropdown w-full rounded px-3 py-2 border focus:outline-none focus:ring-2"
						>
							<option value="pt">{t('portuguese')}</option>
							<option value="en">{t('english')}</option>
						</select>
					</div>

					{/* Tema */}
					{/* Tema */}
					<div className="mb-4">
						<label className="block text-sm font-semibold text-slate-300 mb-2">
							{t('theme')}
						</label>
						<select
							value={theme}
							onChange={(e) => handleThemeChange(e.target.value as Theme)}
							className="settings-dropdown w-full rounded px-3 py-2 border focus:outline-none focus:ring-2"
						>
							{themes.map((t) => (
								<option key={t.id} value={t.id}>
									{t.name}
								</option>
							))}
						</select>
					</div>

					{/* Copiar para área de transferência */}
					<div className="mb-4">
						<label className="flex items-start gap-3 cursor-pointer">
							<input
								type="checkbox"
								checked={copyToClipboard}
								onChange={(e) => handleCopyToClipboardChange(e.target.checked)}
								className="w-5 h-5 mt-0.5 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-2 focus:ring-primary-500"
							/>
							<div className="flex-1">
								<div className="text-sm font-semibold text-slate-300">
									{t('copyToClipboard')}
								</div>
								<div className="text-xs text-slate-400 mt-0.5">
									{t('copyToClipboardDesc')}
								</div>
							</div>
						</label>
					</div>

					{/* Som de captura */}
					<div className="mb-4">
						<label className="flex items-start gap-3 cursor-pointer">
							<input
								type="checkbox"
								checked={soundEnabled}
								onChange={(e) => handleSoundEnabledChange(e.target.checked)}
								className="w-5 h-5 mt-0.5 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-2 focus:ring-primary-500"
							/>
							<div className="flex-1">
								<div className="text-sm font-semibold text-slate-300">
									{t('soundEnabled')}
								</div>
								<div className="text-xs text-slate-400 mt-0.5">
									{t('soundEnabledDesc')}
								</div>
							</div>
						</label>
					</div>

					{/* Cursor nos screenshots */}
					<div className="mb-4">
						<label className="flex items-start gap-3 cursor-pointer">
							<input
								type="checkbox"
								checked={cursorInScreenshots}
								onChange={(e) =>
									handleCursorInScreenshotsChange(e.target.checked)
								}
								className="w-5 h-5 mt-0.5 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-2 focus:ring-primary-500"
							/>
							<div className="flex-1">
								<div className="text-sm font-semibold text-slate-300">
									{t('cursorInScreenshots')}
								</div>
								<div className="text-xs text-slate-400 mt-0.5">
									{t('cursorInScreenshotsDesc')}
								</div>
							</div>
						</label>
					</div>

					{/* Separator */}
					<div className="border-t border-slate-700 my-6"></div>

					{/* Capture Shortcuts Section */}
					<div className="mb-4">
						<h3 className="text-sm font-bold text-slate-300 mb-3">
							⌨️ {t('captureShortcuts')}
						</h3>

						{/* Quick Print Shortcut */}
						<div className="mb-3 bg-slate-900 p-3 rounded">
							<div className="flex items-center justify-between mb-2">
								<div className="flex-1">
									<div className="text-sm font-semibold text-slate-300">
										⚡ {t('quickPrint')}
									</div>
									<div className="text-xs text-slate-400 mt-0.5">
										{t('quickPrintDesc')}
									</div>
								</div>
							</div>
							{editingShortcut === 'quick' ? (
								<div className="flex gap-2 mt-2">
									<input
										type="text"
										className="input-field text-xs flex-1 py-1 px-2"
										value={tempShortcut}
										readOnly
										onKeyDown={handleShortcutKeyDown}
										placeholder={t('pressKeys')}
										autoFocus
									/>
									<button
										onClick={handleShortcutSave}
										className="btn-secondary text-xs py-1 px-2"
										disabled={!tempShortcut}
									>
										✓
									</button>
									<button
										onClick={handleShortcutCancel}
										className="btn-secondary text-xs py-1 px-2"
									>
										✕
									</button>
								</div>
							) : (
								<div className="flex items-center gap-2 mt-2">
									<code className="text-xs bg-slate-800 px-2 py-1 rounded text-blue-400">
										{shortcutQuick}
									</code>
									<button
										onClick={() => handleShortcutEdit('quick')}
										className="btn-secondary text-xs py-1 px-2"
									>
										✏️ {t('edit')}
									</button>
								</div>
							)}
						</div>

						{/* Fullscreen Shortcut */}
						<div className="mb-3 bg-slate-900 p-3 rounded">
							<div className="flex items-center justify-between mb-2">
								<div className="flex-1">
									<div className="text-sm font-semibold text-slate-300">
										🖼️ {t('fullScreen')}
									</div>
									<div className="text-xs text-slate-400 mt-0.5">
										{t('fullScreenDesc')}
									</div>
								</div>
							</div>
							{editingShortcut === 'full' ? (
								<div className="flex gap-2 mt-2">
									<input
										type="text"
										className="input-field text-xs flex-1 py-1 px-2"
										value={tempShortcut}
										readOnly
										onKeyDown={handleShortcutKeyDown}
										placeholder={t('pressKeys')}
										autoFocus
									/>
									<button
										onClick={handleShortcutSave}
										className="btn-secondary text-xs py-1 px-2"
										disabled={!tempShortcut}
									>
										✓
									</button>
									<button
										onClick={handleShortcutCancel}
										className="btn-secondary text-xs py-1 px-2"
									>
										✕
									</button>
								</div>
							) : (
								<div className="flex items-center gap-2 mt-2">
									<code className="text-xs bg-slate-800 px-2 py-1 rounded text-blue-400">
										{shortcutFull}
									</code>
									<button
										onClick={() => handleShortcutEdit('full')}
										className="btn-secondary text-xs py-1 px-2"
									>
										✏️ {t('edit')}
									</button>
								</div>
							)}
						</div>

						{/* Area Shortcut */}
						<div className="mb-3 bg-slate-900 p-3 rounded">
							<div className="flex items-center justify-between mb-2">
								<div className="flex-1">
									<div className="text-sm font-semibold text-slate-300">
										📐 {t('area')}
									</div>
									<div className="text-xs text-slate-400 mt-0.5">
										{t('areaDesc')}
									</div>
								</div>
							</div>
							{editingShortcut === 'area' ? (
								<div className="flex gap-2 mt-2">
									<input
										type="text"
										className="input-field text-xs flex-1 py-1 px-2"
										value={tempShortcut}
										readOnly
										onKeyDown={handleShortcutKeyDown}
										placeholder={t('pressKeys')}
										autoFocus
									/>
									<button
										onClick={handleShortcutSave}
										className="btn-secondary text-xs py-1 px-2"
										disabled={!tempShortcut}
									>
										✓
									</button>
									<button
										onClick={handleShortcutCancel}
										className="btn-secondary text-xs py-1 px-2"
									>
										✕
									</button>
								</div>
							) : (
								<div className="flex items-center gap-2 mt-2">
									<code className="text-xs bg-slate-800 px-2 py-1 rounded text-blue-400">
										{shortcutArea}
									</code>
									<button
										onClick={() => handleShortcutEdit('area')}
										className="btn-secondary text-xs py-1 px-2"
									>
										✏️ {t('edit')}
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
