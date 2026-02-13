import { useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSystemHistory } from '../hooks/useSystemHistory';
import { HeaderData, TestType } from '../interfaces';
import AutocompleteInput from './AutocompleteInput';
import HelpTips from './HelpTips';
import Settings from './Settings';

interface HeaderProps {
	headerData: HeaderData;
	setHeaderData: (data: HeaderData) => void;
}

export default function Header({ headerData, setHeaderData }: HeaderProps) {
	const [showSettings, setShowSettings] = useState(false);
	const { t } = useLanguage();
	const { filterHistory, addToHistory, removeFromHistory } = useSystemHistory();

	const handleChange = (field: keyof HeaderData, value: string) => {
		setHeaderData({ ...headerData, [field]: value });
	};

	// Placeholder dinâmico baseado no tipo selecionado
	const testTypePlaceholder = useMemo(() => {
		switch (headerData.testType) {
			case 'card':
				return t('testTypeCardPlaceholder');
			case 'regressivo':
				return t('testTypeRegressivoPlaceholder');
			case 'gmud':
				return t('testTypeGmudPlaceholder');
			case 'outro':
				return t('testTypeOutroPlaceholder');
			default:
				return t('selectOption');
		}
	}, [headerData.testType, t]);

	return (
		<div
			className="bg-slate-800 border-b border-slate-700 p-3"
			style={{ WebkitAppRegion: 'drag' } as any}
		>
			<div className="flex items-center gap-3 mb-2 ml-20">
				<h1 className="text-base font-bold text-primary-400">
					{t('appTitle')}
				</h1>
				<div
					style={{ WebkitAppRegion: 'no-drag' } as any}
					className="flex items-center gap-2"
				>
					<HelpTips />
					<button
						onClick={() => setShowSettings(true)}
						className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
						title="Configurações"
					>
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
							/>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
					</button>
				</div>
			</div>

			<Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />

			<div
				className="grid grid-cols-3 gap-2"
				style={{ WebkitAppRegion: 'no-drag' } as any}
			>
				<div>
					<label className="block text-xs font-medium text-slate-300 mb-1">
						{t('testResult')}
					</label>
					<select
						className="input-field w-full text-xs py-1.5"
						value={headerData.testName || ''}
						onChange={(e) => handleChange('testName', e.target.value)}
					>
						<option value="">{t('selectOption')}</option>
						<option value="approved">{t('approved')}</option>
						<option value="reproved">{t('reproved')}</option>
						<option value="partial">{t('partial')}</option>
					</select>
				</div>

				<div>
					<label className="block text-xs font-medium text-slate-300 mb-1">
						{t('system')}
					</label>
					<AutocompleteInput
						value={headerData.system || ''}
						onChange={(value) => handleChange('system', value)}
						placeholder="Ex: hom-regressivo-b2c.voegol.com.br"
						className="input-field w-full text-xs py-1.5"
						suggestions={filterHistory(headerData.system || '')}
						onRemoveSuggestion={removeFromHistory}
						onBlur={addToHistory}
					/>
				</div>

				<div>
					<label className="block text-xs font-medium text-slate-300 mb-1">
						{t('testCycle')}
					</label>
					<input
						type="text"
						className="input-field w-full text-xs py-1.5"
						placeholder="Ex: TSTGOL-R2960"
						value={headerData.testCycle || ''}
						onChange={(e) => handleChange('testCycle', e.target.value)}
					/>
				</div>

				<div>
					<label className="block text-xs font-medium text-slate-300 mb-1">
						{t('testCase')}
					</label>
					<input
						type="text"
						className="input-field w-full text-xs py-1.5"
						placeholder="Ex: TSTGOL-T13231 (1.0)"
						value={headerData.testCase || ''}
						onChange={(e) => handleChange('testCase', e.target.value)}
					/>
				</div>

				<div>
					<label className="block text-xs font-medium text-slate-300 mb-1">
						{t('testType')}
					</label>
					<div className="flex items-center gap-0">
						{/* Dropdown Tipo */}
						<select
							className="input-field text-xs py-1.5 rounded-r-none border-r-0 w-32"
							value={headerData.testType || ''}
							onChange={(e) =>
								handleChange('testType', e.target.value as TestType)
							}
						>
							<option value="">{t('selectOption')}</option>
							<option value="card">{t('card')}</option>
							<option value="regressivo">{t('regressivo')}</option>
							<option value="gmud">{t('gmud')}</option>
							<option value="outro">{t('outro')}</option>
						</select>

						{/* Input Valor (colado) */}
						<input
							type="text"
							className="input-field flex-1 text-xs py-1.5 rounded-l-none"
							placeholder={testTypePlaceholder}
							value={headerData.testTypeValue || ''}
							onChange={(e) => handleChange('testTypeValue', e.target.value)}
							autoComplete="off"
							disabled={!headerData.testType}
						/>
					</div>
				</div>

				<div>
					<label className="block text-xs font-medium text-slate-300 mb-1">
						{t('executionDateTime')}
					</label>
					<input
						type="text"
						className="input-field w-full text-xs py-1.5 bg-slate-700"
						value={new Date().toLocaleString('pt-BR')}
						readOnly
					/>
				</div>
			</div>
		</div>
	);
}
