/**
 * Settings Component
 *
 * Modal de configurações do aplicativo
 * Refatorado para usar hooks customizados e componentes reutilizáveis
 */

import { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAppSettings } from '../hooks/useAppSettings';
import {
    useSettingsState,
    type Language,
    type Theme,
} from '../hooks/useSettingsState';
import ShortcutEditor from './ShortcutEditor';

interface SettingsProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
	const { t } = useLanguage();

	// App settings (pasta raiz, executor)
	const { settings, setRootFolder, setExecutorName } = useAppSettings();

	const {
		// Basic settings
		pdfOrientation,
		theme,
		language,
		copyToClipboard,
		soundEnabled,
		cursorInScreenshots,
		handlePdfOrientationChange,
		handleThemeChange,
		handleLanguageChange,
		handleCopyToClipboardChange,
		handleSoundEnabledChange,
		handleCursorInScreenshotsChange,

		// Cleanup settings
		autoDeleteAfterDays,
		cleanupInProgress,
		handleAutoDeleteDaysChange,
		handleCleanupNow,

		// Shortcuts
		shortcutFull,
		shortcutArea,
		shortcutQuick,
		editingShortcut,
		tempShortcut,
		handleShortcutEdit,
		handleShortcutSave,
		handleShortcutCancel,
		handleShortcutKeyDown,
	} = useSettingsState();

	// ==================== CLICK OUTSIDE TO CLOSE ====================

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

	// ==================== THEMES DATA ====================

	const themes = [
		{ id: 'blue' as Theme, name: t('themeBlue') },
		{ id: 'dark' as Theme, name: t('themeDark') },
		{ id: 'grey' as Theme, name: t('themeGrey') },
		{ id: 'rose' as Theme, name: t('themeRose') },
		{ id: 'light' as Theme, name: t('themeLight') },
		{ id: 'green' as Theme, name: t('themeGreen') },
	];

	// ==================== RENDER ====================

	if (!isOpen) return null;

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

					{/* ROOT FOLDER */}
					<div className="mb-4">
						<label className="block text-sm font-semibold text-slate-300 mb-2">
							📁 {t('rootFolder')}
						</label>
						<div className="text-xs text-slate-400 mb-2">
							{t('rootFolderDesc')}
						</div>
						<div className="flex items-center gap-2">
							<input
								type="text"
								value={settings.rootFolder || ''}
								placeholder={t('noRootFolderSelected')}
								readOnly
								className="flex-1 bg-slate-700 text-slate-300 text-sm px-3 py-2 rounded border border-slate-600 focus:outline-none"
							/>
							<button
								onClick={() => setRootFolder(true)}
								className="btn-secondary text-xs py-2 px-3 whitespace-nowrap"
							>
								{t('selectRootFolder')}
							</button>
						</div>
					</div>

					{/* EXECUTOR NAME */}
					<div className="mb-4">
						<label className="block text-sm font-semibold text-slate-300 mb-2">
							👤 {t('executorName')}
						</label>
						<div className="text-xs text-slate-400 mb-2">
							{t('executorNameDesc')}
						</div>
						<input
							type="text"
							value={settings.executorName || ''}
							onChange={(e) => setExecutorName(e.target.value)}
							placeholder={t('executorNamePlaceholder')}
							className="w-full bg-slate-700 text-slate-300 text-sm px-3 py-2 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
						/>
					</div>

					{/* Separator */}
					<div className="border-t border-slate-700 my-6"></div>

					{/* PDF Orientation */}
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

					{/* Language */}
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

					{/* Theme */}
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

					{/* Copy to Clipboard */}
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

					{/* Sound Enabled */}
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

					{/* Cursor in Screenshots */}
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

					{/* Keyboard Shortcuts Section */}
					<div className="mb-4">
						<h3 className="text-sm font-bold text-slate-300 mb-3">
							⌨️ {t('captureShortcuts')}
						</h3>

						<ShortcutEditor
							type="quick"
							icon="⚡"
							titleKey="quickPrint"
							descKey="quickPrintDesc"
							currentShortcut={shortcutQuick}
							isEditing={editingShortcut === 'quick'}
							tempShortcut={tempShortcut}
							onEdit={handleShortcutEdit}
							onSave={handleShortcutSave}
							onCancel={handleShortcutCancel}
							onKeyDown={handleShortcutKeyDown}
						/>

						<ShortcutEditor
							type="full"
							icon="🖼️"
							titleKey="fullScreen"
							descKey="fullScreenDesc"
							currentShortcut={shortcutFull}
							isEditing={editingShortcut === 'full'}
							tempShortcut={tempShortcut}
							onEdit={handleShortcutEdit}
							onSave={handleShortcutSave}
							onCancel={handleShortcutCancel}
							onKeyDown={handleShortcutKeyDown}
						/>

						<ShortcutEditor
							type="area"
							icon="📐"
							titleKey="area"
							descKey="areaDesc"
							currentShortcut={shortcutArea}
							isEditing={editingShortcut === 'area'}
							tempShortcut={tempShortcut}
							onEdit={handleShortcutEdit}
							onSave={handleShortcutSave}
							onCancel={handleShortcutCancel}
							onKeyDown={handleShortcutKeyDown}
						/>
					</div>

					{/* Cleanup Settings Section */}
					<div className="mb-4">
						<h3 className="text-sm font-bold text-slate-300 mb-3">
							🧹 {t('cleanupSettings')}
						</h3>

						<div className="bg-slate-700/50 p-3 rounded-lg mb-2">
							<div className="flex items-center justify-between mb-2">
								<div className="flex-1">
									<h4 className="text-sm font-medium text-slate-200">
										{t('autoDeleteAfterDays')}
									</h4>
									<p className="text-xs text-slate-400 mt-1">
										{t('autoDeleteAfterDaysDesc')}
									</p>
								</div>
								<div className="ml-3">
									<input
										type="number"
										min="0"
										max="365"
										value={autoDeleteAfterDays}
										onChange={(e) =>
											handleAutoDeleteDaysChange(parseInt(e.target.value) || 0)
										}
										className="w-20 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-sm text-slate-200 text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
									/>
								</div>
							</div>
							{autoDeleteAfterDays === 0 && (
								<p className="text-xs text-amber-400 italic">
									{t('neverDelete')}
								</p>
							)}
						</div>

						{autoDeleteAfterDays > 0 && (
							<button
								onClick={async () => {
									if (
										window.confirm(
											t('confirmCleanup').replace(
												'{days}',
												autoDeleteAfterDays.toString(),
											),
										)
									) {
										const result = await handleCleanupNow();
										if (result) {
											alert(
												`${t('cleanupComplete')}: ${result.deletedCount} ${t('testsDeleted')}`,
											);
										} else {
											alert(t('noTestsToDelete'));
										}
									}
								}}
								disabled={cleanupInProgress}
								className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
							>
								{cleanupInProgress ? t('cleanupInProgress') : t('cleanupNow')}
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
