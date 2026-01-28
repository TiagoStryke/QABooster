import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

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
				</div>
			</div>
		</div>
	);
}
