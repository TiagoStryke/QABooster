/**
 * Toolbar Component
 *
 * Barra de ferramentas com controles de captura e geração de PDF
 * Refatorado para usar hooks customizados e serviços
 */

import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAppSettings } from '../hooks/useAppSettings';
import { useToolbarState } from '../hooks/useToolbarState';
import { HeaderData, ImageData } from '../interfaces';
import { ipcService } from '../services/ipc-service';
import { generateTestPDF } from '../services/pdf-generator-service';

interface ToolbarProps {
	currentFolder: string;
	images: ImageData[];
	headerData: HeaderData;
	setHeaderData: (data: HeaderData) => void;
	onSaveHeaderData: () => void;
	onNewTest: () => void;
	executePendingRename: () => Promise<boolean>;
	showEditor?: boolean;
}

export default function Toolbar({
	currentFolder,
	images,
	headerData,
	setHeaderData,
	onSaveHeaderData,
	onNewTest,
	executePendingRename,
	showEditor = false,
}: ToolbarProps) {
	const { t } = useLanguage();
	const [isGenerating, setIsGenerating] = useState(false);
	const { settings } = useAppSettings();

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

		// Validação 2: Validar header data usando validação do banco de dados
		// (testResult é obrigatório para PDF)
		const validation = await ipcService.validateForPDF(headerData);
		if (!validation.isValid) {
			// Traduzir nomes dos campos faltantes
			const fieldTranslations: Record<string, string> = {
				testName: t('testResult'),
				system: t('system'),
				testCycle: t('testCycle'),
				testCase: t('testCase'),
				testType: t('testType'),
				testTypeValue: t('testTypeValue'),
			};

			const missingFieldsText = validation.missingFields
				.map((field) => fieldTranslations[field] || field)
				.join(', ');

			alert(
				`${t('incompleteHeaderData')}\n\n${t('missingFields')}: ${missingFieldsText}`,
			);
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

		// Execute pending rename BEFORE saving
		await executePendingRename();

		// Capturar data/hora atual no momento da geração do PDF
		const currentDateTime = new Date().toLocaleString('pt-BR');
		const updatedHeaderData = {
			...headerData,
			executionDateTime: currentDateTime,
		};

		// Atualizar headerData com a data capturada
		setHeaderData(updatedHeaderData);

		// Salvar headerData com data atualizada
		await onSaveHeaderData();

		// Gerar PDF usando serviço com data capturada
		const result = await generateTestPDF({
			images,
			headerData: updatedHeaderData,
			executorName: settings.executorName,
			pdfOrientation,
			t,
		});

		setIsGenerating(false);

		if (result.success) {
			// PDF gerado com sucesso - marcar teste como concluído
			console.log('[Toolbar] PDF generated successfully');

			// Buscar testId pelo folderPath
			if (currentFolder) {
				try {
					const allTests = await ipcService.getAllTests();
					const currentTest = allTests.find(
						(t) => t.folderPath === currentFolder,
					);

					if (currentTest) {
						// Marcar como concluído e salvar caminho do PDF
						await ipcService.updateTest(currentTest.id, {
							status: 'completed',
							pdfGenerated: true,
							pdfPath: result.filepath, // Salvar caminho do PDF
						});
						console.log(
							'[Toolbar] Test marked as completed with PDF path:',
							result.filepath,
						);
					}
				} catch (error) {
					console.error('[Toolbar] Error marking test as completed:', error);
				}
			}
		} else if (result.error !== 'cancelled') {
			alert(`${t('errorGeneratingPDF')}: ${result.error}`);
		}
	};

	const handleOpenFolder = async () => {
		if (currentFolder) {
			try {
				await ipcService.openFolderInFinder(currentFolder);
			} catch (error) {
				console.error('[Toolbar] Error opening folder:', error);
			}
		}
	};

	return (
		<>
			{/* Fixed Area Button */}
			<button
				onClick={handleAreaButtonClick}
				disabled={isSelectingArea}
				className={`btn-secondary text-xs py-1 px-3 flex items-center gap-1 flex-shrink-0 transition-colors ${
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

			{/* Monitor Selection */}
			{displays.length > 1 && (
				<select
					value={selectedDisplay}
					onChange={(e) => handleDisplayChange(parseInt(e.target.value))}
					className="input-field text-xs py-1 px-2 flex-shrink-0"
					title={t('monitor')}
				>
					{displays.map((display) => (
						<option key={display.id} value={display.id}>
							🖥️ {display.label}
						</option>
					))}
				</select>
			)}

{/* Folder path - flex-1 SEMPRE reserva o espaço central, sem saltar */}
		<div className="flex-1 flex items-center gap-2 text-xs bg-slate-900 px-3 py-1.5 rounded-lg min-w-0">
			{currentFolder ? (
				<>
					<svg
						className="w-4 h-4 text-slate-400 flex-shrink-0"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
						/>
					</svg>
					<span className="text-slate-300 truncate">{currentFolder}</span>
					<button
						onClick={handleOpenFolder}
						className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
						title={t('openFolderInFinder')}
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
						</svg>
					</button>
				</>
			) : (
				<span className="text-slate-600 italic">{t('noFolderSelected')}</span>
			)}
		</div>

			{/* Image Counter */}
			<span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full flex-shrink-0">
				{images.length} {images.length === 1 ? t('image') : t('images')}
			</span>

			{/* Generate PDF Button */}
			<button
				onClick={handleGeneratePDF}
				disabled={isGenerating || images.length === 0}
				className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
			>
				{isGenerating ? (
					<>
						<div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
						{t('generatingPDF')}
					</>
				) : (
					<>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
						</svg>
						{t('generatePDF')}
					</>
				)}
			</button>
		</>
	);
}
