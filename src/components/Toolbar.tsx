/**
 * Toolbar Component
 *
 * Barra de ferramentas com controles de captura e geração de PDF
 * Refatorado para usar hooks customizados e serviços
 */

import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAppSettings } from '../hooks/useAppSettings';
import { useSystemHistory } from '../hooks/useSystemHistory';
import { useTestTypeHistory } from '../hooks/useTestTypeHistory';
import { useToolbarState } from '../hooks/useToolbarState';
import { HeaderData, ImageData } from '../interfaces';
import { generateTestPDF } from '../services/pdf-generator-service';

interface ToolbarProps {
	currentFolder: string;
	images: ImageData[];
	headerData: HeaderData;
	onSaveHeaderData: () => void;
	onNewTest: () => void;
	showEditor?: boolean;
}

export default function Toolbar({
	currentFolder: _currentFolder,
	images,
	headerData,
	onSaveHeaderData,
	onNewTest,
	showEditor = false,
}: ToolbarProps) {
	const { t } = useLanguage();
	const [isGenerating, setIsGenerating] = useState(false);
	const { settings } = useAppSettings();
	const { addToHistory: addSystemToHistory } = useSystemHistory();
	const { addToHistory: addTestTypeToHistory } = useTestTypeHistory();

	// Estados do toolbar (displays, área fixa, orientação PDF)
	const {
		displays,
		selectedDisplay,
		isSelectingArea,
		useSavedArea,
		hasAreaDefined,
		pdfOrientation,
		handleDisplayChange,
		handleAreaButtonClick,
	} = useToolbarState(t);

	// ==================== PDF GENERATION ====================

	const handleGeneratePDF = async () => {
		// Validação 1: Verificar se executorName está configurado
		if (!settings.executorName) {
			alert(t('incompleteHeaderData'));
			return;
		}

		// Validação 2: Verificar se todos os campos do header estão preenchidos
		if (
			!headerData.testName ||
			!headerData.system ||
			!headerData.testCycle ||
			!headerData.testCase ||
			!headerData.testType ||
			!headerData.testTypeValue
		) {
			alert(t('incompleteHeaderData'));
			return;
		}

		// Validação 3: Verificar se há editor aberto
		if (showEditor) {
			alert(t('saveEditsBeforePDF'));
			return;
		}

		// Validação 4: Verificar se há imagens
		if (images.length === 0) {
			alert(t('noImagesToGeneratePDF'));
			return;
		}

		setIsGenerating(true);

		// Salvar headerData antes de gerar PDF
		await onSaveHeaderData();

		// Gerar PDF usando serviço
		const result = await generateTestPDF({
			images,
			headerData,
			executorName: settings.executorName,
			pdfOrientation,
			t,
		});

		setIsGenerating(false);

		if (result.success) {
			// PDF gerado com sucesso - salvar no histórico
			if (headerData.system) {
				addSystemToHistory(headerData.system);
			}
			if (headerData.testType && headerData.testTypeValue) {
				addTestTypeToHistory(headerData.testType, headerData.testTypeValue);
			}
		} else if (result.error !== 'cancelled') {
			alert(`${t('errorGeneratingPDF')}: ${result.error}`);
		}
	};

	// ==================== RENDER ====================

	return (
		<div className="bg-slate-800 border-b border-slate-700 p-3">
			<div className="flex items-center justify-between mb-2">
				<div className="flex items-center gap-2">
					{/* Monitor Selection */}
					{displays.length > 1 && (
						<>
							<select
								value={selectedDisplay}
								onChange={(e) => handleDisplayChange(parseInt(e.target.value))}
								className="input-field text-xs py-1 px-2"
								title={t('monitor')}
							>
								{displays.map((display) => (
									<option key={display.id} value={display.id}>
										🖥️ {display.label}
									</option>
								))}
							</select>
							<div className="w-px h-6 bg-slate-700" />
						</>
					)}

					{/* Fixed Area Button - Cycles: Define → Active (green) → Off (gray) → Define */}
					<button
						onClick={handleAreaButtonClick}
						disabled={isSelectingArea}
						className={`btn-secondary text-xs py-1 px-3 flex items-center gap-2 transition-colors ${
							hasAreaDefined && useSavedArea
								? 'bg-green-900 text-green-100 hover:bg-green-800'
								: 'bg-slate-700 text-slate-300'
						}`}
						title={
							hasAreaDefined && useSavedArea
								? t('fixedAreaActive')
								: t('defineFixedArea')
						}
					>
						{hasAreaDefined && useSavedArea ? (
							<>✓ {t('fixedAreaActive')} 🟢</>
						) : (
							<>📐 {t('defineFixedArea')}</>
						)}
					</button>
				</div>

				<div className="flex items-center gap-2">
					{/* Image Counter */}
					<span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full">
						{images.length} {images.length === 1 ? t('image') : t('images')}
					</span>

					{/* Generate PDF Button */}
					<button
						onClick={handleGeneratePDF}
						disabled={isGenerating || images.length === 0}
						className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isGenerating ? (
							<>
								<div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
								{t('generatingPDF')}
							</>
						) : (
							<>
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
										d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
									/>
								</svg>
								{t('generatePDF')}
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
