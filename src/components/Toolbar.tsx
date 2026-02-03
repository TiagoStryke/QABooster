import { jsPDF } from 'jspdf';
import { useEffect, useState } from 'react';
import { HeaderData, ImageData } from '../App';
import approvedIcon from '../assets/icons/approved.png';
import partialIcon from '../assets/icons/partial.png';
import reprovedIcon from '../assets/icons/reproved.png';
import golLogo from '../assets/logos/logo-gol-1024.png';
import { useLanguage } from '../contexts/LanguageContext';

const { ipcRenderer } = window.require('electron');

interface ToolbarProps {
	currentFolder: string;
	images: ImageData[];
	headerData: HeaderData;
	onSaveHeaderData: () => void;
	onNewTest: () => void;
	showEditor?: boolean;
}

interface Display {
	id: number;
	label: string;
	bounds: { x: number; y: number; width: number; height: number };
	primary: boolean;
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
	const [displays, setDisplays] = useState<Display[]>([]);
	const [selectedDisplay, setSelectedDisplay] = useState(
		parseInt(localStorage.getItem('qabooster-display') || '0'),
	);
	const [isSelectingArea, setIsSelectingArea] = useState(false);
	const [useSavedArea, setUseSavedArea] = useState(
		localStorage.getItem('qabooster-use-saved-area') === 'true',
	);
	const [hasAreaDefined, setHasAreaDefined] = useState(false);
	const [pdfOrientation, setPdfOrientation] = useState<
		'portrait' | 'landscape'
	>(
		(localStorage.getItem('qabooster-pdf-orientation') as
			| 'portrait'
			| 'landscape') || 'portrait',
	);

	useEffect(() => {
		// Escutar mudanças de orientação do PDF vindas do Settings
		const handlePdfOrientationChange = (e: CustomEvent) => {
			setPdfOrientation(e.detail);
		};

		window.addEventListener(
			'pdf-orientation-changed',
			handlePdfOrientationChange as EventListener,
		);

		return () => {
			window.removeEventListener(
				'pdf-orientation-changed',
				handlePdfOrientationChange as EventListener,
			);
		};
	}, []);

	useEffect(() => {
		// Carregar displays disponíveis
		ipcRenderer.invoke('get-displays').then((displays: Display[]) => {
			setDisplays(displays);
		});

		// Listener para mudanças nos displays
		const handleDisplaysUpdated = (_: any, updatedDisplays: Display[]) => {
			setDisplays(updatedDisplays);
		};

		const handleDisplayChanged = (_: any, newDisplayId: number) => {
			setSelectedDisplay(newDisplayId);
			localStorage.setItem('qabooster-display', newDisplayId.toString());
		};

		ipcRenderer.on('displays-updated', handleDisplaysUpdated);
		ipcRenderer.on('display-changed', handleDisplayChanged);

		// Enviar preferência de área salva ao main process
		ipcRenderer.invoke('set-use-saved-area', useSavedArea);

		// Enviar display selecionado ao main process
		ipcRenderer.invoke('set-display', selectedDisplay);

		// Verificar se há área salva
		ipcRenderer.invoke('get-saved-area').then((area: any) => {
			setHasAreaDefined(area !== null);
		});

		// Listen for area selection events
		ipcRenderer.on('area-saved-with-confirmation', (_: any, area: any) => {
			setIsSelectingArea(false);
			setHasAreaDefined(true);
			// Mostra mensagem de confirmação
			alert(`${t('areaSaved')}: ${area.width}x${area.height}px`);
			// Marca o checkbox automaticamente
			setUseSavedArea(true);
			localStorage.setItem('useSavedArea', 'true');
			ipcRenderer.invoke('set-use-saved-area', true);
		});

		ipcRenderer.on('area-selection-cancelled', () => {
			setIsSelectingArea(false);
		});

		return () => {
			ipcRenderer.removeAllListeners('area-saved-with-confirmation');
			ipcRenderer.removeAllListeners('area-selection-cancelled');
			ipcRenderer.removeAllListeners('displays-updated');
			ipcRenderer.removeAllListeners('display-changed');
		};
	}, []);

	const handleDisplayChange = async (displayId: number) => {
		setSelectedDisplay(displayId);
		await ipcRenderer.invoke('set-display', displayId);
		localStorage.setItem('qabooster-display', displayId.toString());
	};

	const handleSelectArea = async () => {
		setIsSelectingArea(true);
		await ipcRenderer.invoke('open-area-selector');
	};

	const handleAreaButtonClick = () => {
		if (!hasAreaDefined || !useSavedArea) {
			// Não tem área OU está desligado - abre seletor
			handleSelectArea();
		} else {
			// Área está ativa - desliga E apaga
			setUseSavedArea(false);
			setHasAreaDefined(false);
			localStorage.setItem('qabooster-use-saved-area', 'false');
			ipcRenderer.invoke('set-use-saved-area', false);
			ipcRenderer.invoke('save-selected-area', null);
		}
	};

	const generatePDF = async () => {
		if (showEditor) {
			alert(t('saveEditsBeforePDF'));
			return;
		}

		if (images.length === 0) {
			alert(t('noImagesToGeneratePDF'));
			return;
		}

		setIsGenerating(true);

		// Salvar headerData antes de gerar PDF
		await onSaveHeaderData();

		try {
			// Usar a orientação configurada
			const pdf = new jsPDF(
				pdfOrientation === 'landscape' ? 'l' : 'p',
				'mm',
				'a4',
			);
			const pageWidth = pdf.internal.pageSize.getWidth();
			const pageHeight = pdf.internal.pageSize.getHeight();
			const margin = 15;
			const imageMargin = 2; // Margem mínima para imagens (2mm)

			// Logo da GOL no topo - manter aspect ratio
			const logoMaxWidth = 50;
			const logoImg = new Image();
			logoImg.src = golLogo;
			await new Promise((resolve) => {
				logoImg.onload = resolve;
			});
			const logoRatio = logoImg.width / logoImg.height;
			const logoWidth = logoMaxWidth;
			const logoHeight = logoWidth / logoRatio;

			pdf.addImage(
				golLogo,
				'PNG',
				pageWidth / 2 - logoWidth / 2,
				10,
				logoWidth,
				logoHeight,
			);

			// First page - Header
			pdf.setFontSize(18);
			pdf.setFont('helvetica', 'bold');
			pdf.text(t('qaTestEvidence'), pageWidth / 2, 10 + logoHeight + 8, {
				align: 'center',
			});

			pdf.setFontSize(12);
			pdf.setFont('helvetica', 'normal');

			let yPos = 10 + logoHeight + 28;
			const lineHeight = 10;

			// Traduz o resultado do teste e retorna info para imagem
			const getTestResultInfo = (value: string) => {
				if (value === 'approved')
					return { text: 'Aprovado', icon: approvedIcon };
				if (value === 'reproved')
					return { text: 'Reprovado', icon: reprovedIcon };
				if (value === 'partial') return { text: 'Parcial', icon: partialIcon };
				return { text: value, icon: null };
			};

			const testResultInfo = getTestResultInfo(headerData.testName);

			// Header data
			const headerItems = [
				{
					label: `${t('testResult')}:`,
					value: testResultInfo.text || '-',
					icon: testResultInfo.icon,
				},
				{ label: `${t('system')}:`, value: headerData.system || '-' },
				{ label: `${t('testCycle')}:`, value: headerData.testCycle || '-' },
				{ label: `${t('testCase')}:`, value: headerData.testCase || '-' },
				{ label: `${t('executor')}:`, value: headerData.executor || '-' },
				{
					label: `${t('executionDateTime')}:`,
					value: new Date().toLocaleString('pt-BR'),
				},
			];

			// Calcular as maiores larguras de label e valor
			pdf.setFont('helvetica', 'bold');
			const maxLabelWidth = Math.max(
				...headerItems.map((item) => pdf.getTextWidth(item.label)),
			);

			pdf.setFont('helvetica', 'normal');
			const maxValueWidth = Math.max(
				...headerItems.map((item) => pdf.getTextWidth(item.value)),
			);

			// Calcular a largura total real da tabela
			const spacing = 10; // Espaço entre label e valor
			const totalTableWidth = maxLabelWidth + spacing + maxValueWidth;

			// Centralizar a tabela baseado no seu ponto médio
			const tableStartX = (pageWidth - totalTableWidth) / 2;

			// Desenhar retângulo laranja com bordas arredondadas em volta dos dados
			const padding = 5; // Padding interno do retângulo
			const boxX = tableStartX - padding;
			const boxY = yPos - 7; // Ajuste para começar acima do primeiro item
			const boxWidth = totalTableWidth + padding * 2 + 8; // +8 para incluir o ícone
			const boxHeight = headerItems.length * lineHeight + padding;
			const cornerRadius = 3;

			// Cor laranja da GOL (#FF6B00)
			pdf.setDrawColor(255, 107, 0);
			pdf.setLineWidth(0.5);
			pdf.roundedRect(
				boxX,
				boxY,
				boxWidth,
				boxHeight,
				cornerRadius,
				cornerRadius,
			);

			headerItems.forEach((item) => {
				pdf.setFont('helvetica', 'bold');
				pdf.text(item.label, tableStartX, yPos);
				pdf.setFont('helvetica', 'normal');
				pdf.text(item.value, tableStartX + maxLabelWidth + spacing, yPos);

				// Adiciona ícone se existir
				if (item.icon) {
					const iconSize = 5; // Tamanho do ícone em mm
					const valueWidth = pdf.getTextWidth(item.value); // Largura real do texto
					const iconX = tableStartX + maxLabelWidth + spacing + valueWidth + 2;
					const iconY = yPos - iconSize + 1; // Ajuste vertical para alinhar
					pdf.addImage(item.icon, 'PNG', iconX, iconY, iconSize, iconSize);
				}

				yPos += lineHeight;
			});

			// Images - carregar via IPC para converter em base64
			for (let i = 0; i < images.length; i++) {
				// Usar a orientação configurada para cada página de imagem
				pdf.addPage('a4', pdfOrientation === 'landscape' ? 'l' : 'p');

				try {
					// Ler imagem como base64 via IPC
					const base64 = await ipcRenderer.invoke(
						'read-image-as-base64',
						images[i].path,
					);

					if (!base64) {
						console.error('Failed to load image:', images[i].path);
						continue;
					}

					const img = new Image();
					img.src = base64;

					await new Promise((resolve, reject) => {
						img.onload = resolve;
						img.onerror = reject;
					});

					const imgWidth = img.width;
					const imgHeight = img.height;
					const ratio = imgWidth / imgHeight;

					// Priorizar altura máxima (ocupar todo espaço vertical com margem mínima)
					let height = pageHeight - 2 * imageMargin;
					let width = height * ratio;

					// Se a largura exceder a página, ajustar pela largura
					if (width > pageWidth - 2 * imageMargin) {
						width = pageWidth - 2 * imageMargin;
						height = width / ratio;
					}

					// Centralizar tanto horizontal quanto verticalmente
					const x = (pageWidth - width) / 2;
					const y = (pageHeight - height) / 2;

					pdf.addImage(base64, 'PNG', x, y, width, height);
				} catch (error) {
					console.error('Error loading image:', error);
				}
			}

			const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
			let fileName = `${t('pdfFilename')}${headerData.testCase || 'teste'}_${date}.pdf`;

			// Verificar se o arquivo já existe
			const checkResult = await ipcRenderer.invoke('check-pdf-exists', {
				filename: fileName,
			});

			if (checkResult.success && checkResult.exists) {
				// Mostrar diálogo de confirmação com botões claros
				const dialogResult = await ipcRenderer.invoke(
					'show-pdf-exists-dialog',
					{
						filename: fileName,
					},
				);

				if (!dialogResult.success) {
					alert(`${t('errorShowingDialog')}: ${dialogResult.error}`);
					return;
				}

				// action: 0 = Substituir, 1 = Criar nova cópia, 2 = Cancelar
				if (dialogResult.action === 2) {
					// Usuário cancelou
					return;
				} else if (dialogResult.action === 1) {
					// Criar nova cópia - buscar próximo nome disponível
					const nextFileResult = await ipcRenderer.invoke(
						'find-next-filename',
						{ baseFilename: fileName },
					);

					if (nextFileResult.success) {
						fileName = nextFileResult.filename;
					} else {
						alert(`Erro ao buscar nome disponível: ${nextFileResult.error}`);
						return;
					}
				}
				// Se action === 0, mantém o fileName original para substituir
			}

			// Salvar PDF diretamente na pasta selecionada via IPC
			const pdfData = pdf.output('datauristring');
			const result = await ipcRenderer.invoke('save-pdf', {
				pdfData,
				filename: fileName,
			});

			if (result.success) {
				// Mostrar dialog com opção de visualizar
				const response = await ipcRenderer.invoke('show-pdf-saved-dialog', {
					filename: fileName,
					filepath: result.filepath,
				});

				if (response.action === 'view') {
					// Abrir PDF no visualizador
					await ipcRenderer.invoke('open-pdf', result.filepath);
				}
			} else {
				alert(`${t('errorSavingPDF')}: ${result.error}`);
			}
		} catch (error) {
			console.error('Error generating PDF:', error);
			alert(t('errorGeneratingPDF'));
		} finally {
			setIsGenerating(false);
		}
	};

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

					{/* Botão Único de Área Fixa - Ciclo: Definir → Ativo (verde) → Desligado (cinza) → Definir */}
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
					<span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full">
						{images.length} {images.length === 1 ? t('image') : t('images')}
					</span>

					<button
						onClick={generatePDF}
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
