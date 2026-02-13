/**
 * PDF Generator Service
 *
 * Serviço responsável pela geração de PDFs com evidências de teste
 */

import { jsPDF } from 'jspdf';
import approvedIcon from '../assets/icons/approved.png';
import partialIcon from '../assets/icons/partial.png';
import reprovedIcon from '../assets/icons/reproved.png';
import golLogo from '../assets/logos/logo-gol-1024.png';
import { HeaderData, ImageData } from '../interfaces';
import { ipcService } from './ipc-service';

interface GeneratePDFParams {
	images: ImageData[];
	headerData: HeaderData;
	executorName: string;
	pdfOrientation: 'portrait' | 'landscape';
	t: (key: string) => string;
}

interface TestResultInfo {
	text: string;
	icon: string | null;
}

/**
 * Traduz o resultado do teste e retorna informações para exibição
 */
function getTestResultInfo(value: string): TestResultInfo {
	if (value === 'approved') return { text: 'Aprovado', icon: approvedIcon };
	if (value === 'reproved') return { text: 'Reprovado', icon: reprovedIcon };
	if (value === 'partial') return { text: 'Parcial', icon: partialIcon };
	return { text: value, icon: null };
}

/**
 * Gera PDF com evidências de teste
 */
export async function generateTestPDF({
	images,
	headerData,
	executorName,
	pdfOrientation,
	t,
}: GeneratePDFParams): Promise<{
	success: boolean;
	error?: string;
	filepath?: string;
}> {
	try {
		// Criar PDF com orientação especificada
		const pdf = new jsPDF(
			pdfOrientation === 'landscape' ? 'l' : 'p',
			'mm',
			'a4',
		);

		const pageWidth = pdf.internal.pageSize.getWidth();
		const pageHeight = pdf.internal.pageSize.getHeight();
		const imageMargin = 2; // Margem mínima para imagens (2mm)

		// ==================== PRIMEIRA PÁGINA - HEADER ====================

		// Logo da GOL no topo
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

		// Título
		pdf.setFontSize(18);
		pdf.setFont('helvetica', 'bold');
		pdf.text(t('qaTestEvidence'), pageWidth / 2, 10 + logoHeight + 8, {
			align: 'center',
		});

		pdf.setFontSize(12);
		pdf.setFont('helvetica', 'normal');

		let yPos = 10 + logoHeight + 28;
		const lineHeight = 10;

		// Header data com ícone de status
		const testResultInfo = getTestResultInfo(headerData.testName);

		// Função para validar se é um card/issue do Jira (CDSUST-XXXX ou CDAPP-XXXX)
		// Aceita maiúsculas e minúsculas
		const isJiraIssue = (value: string): boolean => {
			return /^(CDSUST|CDAPP)-\d+$/i.test(value.trim());
		};

		// Função para normalizar issue do Jira (forçar CDSUST/CDAPP em maiúsculo)
		const normalizeJiraIssue = (value: string): string => {
			return value
				.trim()
				.replace(/^(cdsust|cdapp)(-\d+)$/i, (_, prefix, number) => {
					return prefix.toUpperCase() + number;
				});
		};

		// Construir valor do testType (sem incluir URL no texto)
		let testTypeDisplay = '-';
		let testTypeHasLink = false;
		let testTypeLinkUrl = '';

		if (headerData.testType && headerData.testTypeValue) {
			const value = headerData.testTypeValue.trim();

			// Tipo Progressivo ou Regressivo: validar padrão e criar link
			if (
				headerData.testType === 'progressivo' ||
				headerData.testType === 'regressivo'
			) {
				const typeLabel =
					headerData.testType === 'progressivo' ? 'Progressivo' : 'Regressivo';

				if (isJiraIssue(value)) {
					const normalizedValue = normalizeJiraIssue(value);
					testTypeDisplay = `${typeLabel}: ${normalizedValue}`;
					testTypeHasLink = true;
					testTypeLinkUrl = `https://smiles.atlassian.net/browse/${normalizedValue}`;
				} else {
					testTypeDisplay = `${typeLabel}: ${value}`;
				}
			}
			// Tipo GMUD: mostrar tipo + valor, sem link
			else if (headerData.testType === 'gmud') {
				testTypeDisplay = `GMUD: ${value}`;
			}
			// Tipo Outro: mostrar apenas o valor, sem o tipo
			else if (headerData.testType === 'outro') {
				testTypeDisplay = value;
			}
		}

		// Construir headerItems (não inclui linha de Tipo de Teste se for 'outro')
		const headerItems = [
			{
				label: `${t('testResult')}:`,
				value: testResultInfo.text || '-',
				icon: testResultInfo.icon,
			},
			{ label: `${t('system')}:`, value: headerData.system || '-' },
		];

		// Adicionar linha de Tipo de Teste apenas se NÃO for "outro"
		if (headerData.testType !== 'outro') {
			headerItems.push({ label: `${t('testType')}:`, value: testTypeDisplay });
		}

		// Continuar com os demais campos
		headerItems.push(
			{
				label: `${t('testCycle')}:`,
				value: headerData.testCycle ? headerData.testCycle.toUpperCase() : '-',
			},
			{
				label: `${t('testCase')}:`,
				value: headerData.testCase ? headerData.testCase.toUpperCase() : '-',
			},
			{ label: `${t('executor')}:`, value: executorName || '-' },
			{
				label: `${t('executionDateTime')}:`,
				value:
					headerData.executionDateTime || new Date().toLocaleString('pt-BR'),
			},
		);

		// Calcular larguras para centralização
		pdf.setFont('helvetica', 'bold');
		const maxLabelWidth = Math.max(
			...headerItems.map((item) => pdf.getTextWidth(item.label)),
		);

		pdf.setFont('helvetica', 'normal');
		const maxValueWidth = Math.max(
			...headerItems.map((item) => pdf.getTextWidth(item.value)),
		);

		const spacing = 10;
		const totalTableWidth = maxLabelWidth + spacing + maxValueWidth;
		const tableStartX = (pageWidth - totalTableWidth) / 2;

		// Retângulo laranja ao redor dos dados
		const padding = 5;
		const boxX = tableStartX - padding;
		const boxY = yPos - 7;
		const boxWidth = totalTableWidth + padding * 2 + 8;
		const boxHeight = headerItems.length * lineHeight + padding;
		const cornerRadius = 3;

		pdf.setDrawColor(255, 107, 0); // Cor laranja GOL (#FF6B00)
		pdf.setLineWidth(0.5);
		pdf.roundedRect(
			boxX,
			boxY,
			boxWidth,
			boxHeight,
			cornerRadius,
			cornerRadius,
		);

		// Renderizar itens do header
		headerItems.forEach((item) => {
			pdf.setFont('helvetica', 'bold');
			pdf.text(item.label, tableStartX, yPos);
			pdf.setFont('helvetica', 'normal');

			// Se for o testType e tem link, criar link clicável (azul)
			if (item.label === `${t('testType')}:` && testTypeHasLink) {
				// Separar o label do valor linkável
				const parts = testTypeDisplay.split(': ');
				if (parts.length === 2) {
					const typeLabel = parts[0] + ': '; // "Progressivo: " ou "Regressivo: "
					const linkValue = parts[1]; // "CDSUST-3444"

					const valuePosX = tableStartX + maxLabelWidth + spacing;

					// Renderizar label do tipo (sem link)
					pdf.setTextColor(0, 0, 0);
					pdf.text(typeLabel, valuePosX, yPos);

					// Renderizar valor com link (azul e sublinhado)
					const labelWidth = pdf.getTextWidth(typeLabel);
					pdf.setTextColor(0, 0, 255); // Azul
					pdf.textWithLink(linkValue, valuePosX + labelWidth, yPos, {
						url: testTypeLinkUrl,
					});
					pdf.setTextColor(0, 0, 0); // Voltar para preto
				} else {
					pdf.text(item.value, tableStartX + maxLabelWidth + spacing, yPos);
				}
			} else {
				pdf.text(item.value, tableStartX + maxLabelWidth + spacing, yPos);
			}
			// Adicionar ícone se existir
			if (item.icon) {
				const iconSize = 5;
				const valueWidth = pdf.getTextWidth(item.value);
				const iconX = tableStartX + maxLabelWidth + spacing + valueWidth + 2;
				const iconY = yPos - iconSize + 1;
				pdf.addImage(item.icon, 'PNG', iconX, iconY, iconSize, iconSize);
			}

			yPos += lineHeight;
		});

		// ==================== PÁGINAS DE IMAGENS ====================

		for (let i = 0; i < images.length; i++) {
			pdf.addPage('a4', pdfOrientation === 'landscape' ? 'l' : 'p');

			try {
				// Carregar imagem via IPC
				const base64 = await ipcService.readImageAsBase64(images[i].path);

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

				// Ocupar máximo espaço vertical
				let height = pageHeight - 2 * imageMargin;
				let width = height * ratio;

				// Ajustar se exceder largura
				if (width > pageWidth - 2 * imageMargin) {
					width = pageWidth - 2 * imageMargin;
					height = width / ratio;
				}

				// Centralizar
				const x = (pageWidth - width) / 2;
				const y = (pageHeight - height) / 2;

				pdf.addImage(base64, 'PNG', x, y, width, height);
			} catch (error) {
				console.error('Error loading image:', error);
			}
		}

		// ==================== SALVAR PDF ====================

		const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
		let fileName = `${t('pdfFilename')}${headerData.testCase || 'teste'}_${date}.pdf`;

		// Verificar se arquivo existe
		const checkResult = await ipcService.checkPdfExists(fileName);

		if (checkResult.success && checkResult.exists) {
			const dialogResult = await ipcService.showPdfExistsDialog(fileName);

			if (!dialogResult.success) {
				return {
					success: false,
					error: `${t('errorShowingDialog')}: ${dialogResult.error}`,
				};
			}

			// action: 0 = Substituir, 1 = Nova cópia, 2 = Cancelar
			if (dialogResult.action === 2) {
				return { success: false, error: 'cancelled' };
			} else if (dialogResult.action === 1) {
				const nextFileResult = await ipcService.findNextFilename(fileName);
				if (nextFileResult.success) {
					fileName = nextFileResult.filename;
				} else {
					return { success: false, error: nextFileResult.error };
				}
			}
		}

		// Salvar PDF
		const pdfData = pdf.output('datauristring');
		const result = await ipcService.savePdf({
			pdfData,
			filename: fileName,
		});

		if (result.success) {
			// Mostrar dialog com opção de visualizar
			const response = await ipcService.showPdfSavedDialog(
				fileName,
				result.filepath,
			);

			if (response.action === 'view') {
				await ipcService.openPdf(result.filepath);
			}

			return { success: true, filepath: result.filepath };
		} else {
			return { success: false, error: result.error };
		}
	} catch (error) {
		console.error('Error generating PDF:', error);
		return { success: false, error: String(error) };
	}
}
