import { jsPDF } from 'jspdf';
import { useEffect, useState } from 'react';
import { HeaderData, ImageData } from '../App';

const { ipcRenderer } = window.require('electron');

interface ToolbarProps {
	currentFolder: string;
	images: ImageData[];
	headerData: HeaderData;
	onSaveHeaderData: () => void;
	onNewTest: () => void;
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
}: ToolbarProps) {
	const [shortcut, setShortcut] = useState(
		localStorage.getItem('qabooster-shortcut') || 'CommandOrControl+Shift+S',
	);
	const [shortcutArea, setShortcutArea] = useState(
		localStorage.getItem('qabooster-shortcut-area') ||
			'CommandOrControl+Shift+A',
	);
	// Estados temporários para edição
	const [tempShortcut, setTempShortcut] = useState('');
	const [tempShortcutArea, setTempShortcutArea] = useState('');
	const [isEditingShortcut, setIsEditingShortcut] = useState(false);
	const [isEditingShortcutArea, setIsEditingShortcutArea] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [soundEnabled, setSoundEnabled] = useState(
		localStorage.getItem('qabooster-sound') === 'true',
	);
	const [displays, setDisplays] = useState<Display[]>([]);
	const [selectedDisplay, setSelectedDisplay] = useState(
		parseInt(localStorage.getItem('qabooster-display') || '0'),
	);
	const [isSelectingArea, setIsSelectingArea] = useState(false);
	const [useSavedArea, setUseSavedArea] = useState(
		localStorage.getItem('qabooster-use-saved-area') === 'true',
	);
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

		// Enviar preferência de área salva ao main process
		ipcRenderer.invoke('set-use-saved-area', useSavedArea);

		// Restaurar atalhos salvos no main process
		ipcRenderer.invoke('set-shortcut', shortcut);
		ipcRenderer.invoke('set-area-shortcut', shortcutArea);
		ipcRenderer.invoke('set-display', selectedDisplay);

		// Listen for area selection events
		ipcRenderer.on('area-saved-with-confirmation', (_: any, area: any) => {
			setIsSelectingArea(false);
			// Mostra mensagem de confirmação
			alert(`Área salva: ${area.width}x${area.height}px`);
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
		};
	}, []);

	const handleShortcutChange = async () => {
		if (!tempShortcut) return;
		await ipcRenderer.invoke('set-shortcut', tempShortcut);
		localStorage.setItem('qabooster-shortcut', tempShortcut);
		setShortcut(tempShortcut);
		setIsEditingShortcut(false);
		alert('Atalho de tela cheia atualizado!');
	};

	const handleShortcutAreaChange = async () => {
		if (!tempShortcutArea) return;
		await ipcRenderer.invoke('set-area-shortcut', tempShortcutArea);
		localStorage.setItem('qabooster-shortcut-area', tempShortcutArea);
		setShortcutArea(tempShortcutArea);
		setIsEditingShortcutArea(false);
		alert('Atalho de área selecionada atualizado!');
	};

	// Funções para cancelar edição
	const handleCancelShortcutEdit = () => {
		setTempShortcut('');
		setIsEditingShortcut(false);
	};

	const handleCancelShortcutAreaEdit = () => {
		setTempShortcutArea('');
		setIsEditingShortcutArea(false);
	};

	const handleDisplayChange = async (displayId: number) => {
		setSelectedDisplay(displayId);
		await ipcRenderer.invoke('set-display', displayId);
		localStorage.setItem('qabooster-display', displayId.toString());
	};

	const handleSelectArea = async () => {
		setIsSelectingArea(true);
		await ipcRenderer.invoke('open-area-selector');
	};

	const generatePDF = async () => {
		if (images.length === 0) {
			alert('Nenhuma imagem para gerar PDF');
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

			// First page - Header
			pdf.setFontSize(18);
			pdf.setFont('helvetica', 'bold');
			pdf.text('Evidência de Testes de QA', pageWidth / 2, 30, {
				align: 'center',
			});

			pdf.setFontSize(12);
			pdf.setFont('helvetica', 'normal');

			let yPos = 50;
			const lineHeight = 10;

			// Header data
			const headerItems = [
				{ label: 'Resultado do Teste:', value: headerData.testName || '-' },
				{ label: 'Sistema:', value: headerData.system || '-' },
				{ label: 'Ciclo de Teste:', value: headerData.testCycle || '-' },
				{ label: 'Caso de Teste:', value: headerData.testCase || '-' },
				{ label: 'Executor:', value: headerData.executor || '-' },
				{
					label: 'Data e Hora da Execução:',
					value: new Date().toLocaleString('pt-BR'),
				},
			];

			headerItems.forEach((item) => {
				pdf.setFont('helvetica', 'bold');
				pdf.text(item.label, margin, yPos);
				pdf.setFont('helvetica', 'normal');
				pdf.text(item.value, margin + 60, yPos);
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
			let fileName = `Evidencia_${headerData.testCase || 'teste'}_${date}.pdf`;

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
					alert(`Erro ao mostrar diálogo: ${dialogResult.error}`);
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
				alert(`PDF salvo com sucesso na pasta!\n${fileName}`);
			} else {
				alert(`Erro ao salvar PDF: ${result.error}`);
			}
		} catch (error) {
			console.error('Error generating PDF:', error);
			alert('Erro ao gerar PDF');
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<div className="bg-slate-800 border-b border-slate-700 p-3">
			<div className="flex items-center justify-between mb-2">
				<div className="flex items-center gap-2">
					{/* Tela Cheia */}
					<div className="flex items-center gap-1">
						<label className="text-xs text-slate-300">Tela Cheia:</label>
						<input
							type="text"
							className="input-field text-xs w-32 py-1 px-2"
							value={isEditingShortcut ? tempShortcut : shortcut}
							readOnly
							onFocus={() => {
								setIsEditingShortcut(true);
								setTempShortcut(shortcut);
							}}
							onBlur={() => {
								// Delay para permitir clicar no botão ✓
								setTimeout(() => {
									if (isEditingShortcut) handleCancelShortcutEdit();
								}, 150);
							}}
							onKeyDown={(e) => {
								if (e.key === 'Escape') {
									handleCancelShortcutEdit();
									return;
								}
								if (e.key === 'Enter') {
									handleShortcutChange();
									return;
								}
								e.preventDefault();
								const keys = [];
								if (e.metaKey) keys.push('Cmd');
								if (e.ctrlKey) keys.push('Ctrl');
								if (e.altKey) keys.push('Alt');
								if (e.shiftKey) keys.push('Shift');
								if (
									e.key &&
									!['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)
								) {
									keys.push(e.key.toUpperCase());
								}
								if (keys.length > 0) {
									setTempShortcut(keys.join('+'));
								}
							}}
							placeholder="Pressione teclas"
						/>
						<button
							onClick={handleShortcutChange}
							className="btn-secondary text-xs py-1 px-2"
							disabled={!isEditingShortcut || !tempShortcut}
						>
							✓
						</button>
						{displays.length > 1 && (
							<select
								value={selectedDisplay}
								onChange={(e) => handleDisplayChange(parseInt(e.target.value))}
								className="input-field text-xs py-1 px-2"
								title="Monitor"
							>
								{displays.map((display) => (
									<option key={display.id} value={display.id}>
										{display.label}
									</option>
								))}
							</select>
						)}
					</div>

					<div className="w-px h-6 bg-slate-700" />

					{/* Área */}
					<div className="flex items-center gap-1">
						<label className="text-xs text-slate-300">Área:</label>
						<input
							type="text"
							className="input-field text-xs w-32 py-1 px-2"
							value={isEditingShortcutArea ? tempShortcutArea : shortcutArea}
							readOnly
							onFocus={() => {
								setIsEditingShortcutArea(true);
								setTempShortcutArea(shortcutArea);
							}}
							onBlur={() => {
								// Delay para permitir clicar no botão ✓
								setTimeout(() => {
									if (isEditingShortcutArea) handleCancelShortcutAreaEdit();
								}, 150);
							}}
							onKeyDown={(e) => {
								if (e.key === 'Escape') {
									handleCancelShortcutAreaEdit();
									return;
								}
								if (e.key === 'Enter') {
									handleShortcutAreaChange();
									return;
								}
								e.preventDefault();
								const keys = [];
								if (e.metaKey) keys.push('Cmd');
								if (e.ctrlKey) keys.push('Ctrl');
								if (e.altKey) keys.push('Alt');
								if (e.shiftKey) keys.push('Shift');
								if (
									e.key &&
									!['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)
								) {
									keys.push(e.key.toUpperCase());
								}
								if (keys.length > 0) {
									setTempShortcutArea(keys.join('+'));
								}
							}}
							placeholder="Pressione teclas"
						/>
						<button
							onClick={handleShortcutAreaChange}
							className="btn-secondary text-xs py-1 px-2"
							disabled={!isEditingShortcutArea || !tempShortcutArea}
						>
							✓
						</button>
						<button
							onClick={handleSelectArea}
							disabled={isSelectingArea}
							className="btn-secondary text-xs py-1 px-2"
							title="Selecionar área de captura"
						>
							📐
						</button>
					</div>

					<div className="w-px h-6 bg-slate-700" />

					{/* Checkbox usar área salva */}
					<label className="flex items-center gap-1 text-xs text-slate-300 cursor-pointer">
						<input
							type="checkbox"
							checked={useSavedArea}
							onChange={(e) => {
								const enabled = e.target.checked;
								setUseSavedArea(enabled);
								localStorage.setItem(
									'qabooster-use-saved-area',
									enabled.toString(),
								);
								ipcRenderer.invoke('set-use-saved-area', enabled);
							}}
							className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-2 focus:ring-blue-500"
						/>
						<span>Usar última área salva</span>
					</label>
				</div>

				<div className="flex items-center gap-2">
					{/* Checkbox para habilitar som */}
					<label className="flex items-center gap-1 text-xs text-slate-300 cursor-pointer">
						<input
							type="checkbox"
							checked={soundEnabled}
							onChange={(e) => {
								const enabled = e.target.checked;
								setSoundEnabled(enabled);
								localStorage.setItem('qabooster-sound', enabled.toString());
							}}
							className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-2 focus:ring-blue-500"
						/>
						<span>🔊 Som</span>
					</label>

					<span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full">
						{images.length} {images.length === 1 ? 'imagem' : 'imagens'}
					</span>

					<button
						onClick={generatePDF}
						disabled={isGenerating || images.length === 0}
						className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isGenerating ? (
							<>
								<div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
								Gerando PDF...
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
								Gerar PDF
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
