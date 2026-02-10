/**
 * Folder Structure Service
 *
 * Gerencia a estrutura organizacional de pastas para testes
 * Estrutura: rootFolder/mês-ano/tipo-teste/ciclo/caso/
 * Exemplo: evidencias/01-2026/CDSUST-4535/TSTGOL-R20938/TSTGOL-T20938 (1.0)/
 */

import * as path from 'path';
import { ensureFolder, fileExists } from './file-service';

export interface HeaderData {
	testName: string;
	system: string;
	testCycle: string;
	testCase: string;
	testType: 'card' | 'regressivo' | 'gmud' | 'outro' | '';
	testTypeValue: string;
}

/**
 * Gera o nome da pasta do mês atual no formato MM-YYYY
 * Exemplo: "01-2026"
 */
export function getMonthFolderName(): string {
	const now = new Date();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const year = now.getFullYear();
	return `${month}-${year}`;
}

/**
 * Valida se todos os campos necessários estão preenchidos para SCREENSHOT
 * Resultado do teste (testName) NÃO é obrigatório para screenshot, apenas para PDF
 */
export function validateHeaderForScreenshot(headerData: HeaderData): boolean {
	return !!(
		headerData.system &&
		headerData.testCycle &&
		headerData.testCase &&
		headerData.testType &&
		headerData.testTypeValue
	);
}

/**
 * Valida se todos os campos necessários estão preenchidos para PDF
 * Resultado do teste (testName) É obrigatório para gerar PDF
 */
export function validateHeaderComplete(headerData: HeaderData): boolean {
	return !!(
		headerData.testName &&
		headerData.system &&
		headerData.testCycle &&
		headerData.testCase &&
		headerData.testType &&
		headerData.testTypeValue
	);
}

/**
 * Constrói o caminho completo da estrutura de pastas
 * Baseado no headerData fornecido
 *
 * @param rootFolder - Pasta raiz configurada nas settings
 * @param headerData - Dados do header com informações do teste
 * @returns Caminho completo: rootFolder/mês/tipo/ciclo/caso
 */
export function buildFolderPath(
	rootFolder: string,
	headerData: HeaderData,
): string | null {
	if (!rootFolder || !validateHeaderForScreenshot(headerData)) {
		return null;
	}

	// 1. Pasta do mês
	const monthFolder = getMonthFolderName();

	// 2. Pasta do tipo de teste com prefixo
	// Se for regressivo ou gmud, adiciona prefixo: "regressivo-B2B" ou "gmud-B2B"
	// Se for card ou outro, usa apenas o valor: "CDSUST-1234"
	let typeFolder = headerData.testTypeValue.trim();
	if (headerData.testType === 'regressivo') {
		typeFolder = `regressivo-${typeFolder}`;
	} else if (headerData.testType === 'gmud') {
		typeFolder = `gmud-${typeFolder}`;
	}

	// 3. Pasta do ciclo de teste
	const cycleFolder = headerData.testCycle.trim();

	// 4. Pasta do caso de teste
	const caseFolder = headerData.testCase.trim();

	// Constrói caminho completo
	const fullPath = path.join(
		rootFolder,
		monthFolder,
		typeFolder,
		cycleFolder,
		caseFolder,
	);

	return fullPath;
}

/**
 * Cria toda a estrutura de pastas necessária
 * Verifica cada nível e cria apenas o que não existe
 *
 * @param rootFolder - Pasta raiz configurada nas settings
 * @param headerData - Dados do header com informações do teste
 * @returns Caminho completo criado ou null se inválido
 */
export function ensureFolderStructure(
	rootFolder: string,
	headerData: HeaderData,
): string | null {
	const fullPath = buildFolderPath(rootFolder, headerData);

	if (!fullPath) {
		return null;
	}

	// Cria toda a estrutura de uma vez (ensureFolder é recursivo)
	ensureFolder(fullPath);

	return fullPath;
}

/**
 * Detecta qual parte da estrutura mudou comparando dois headers
 * Retorna o nível que precisa ser renomeado
 *
 * @returns 'month' | 'type' | 'cycle' | 'case' | null
 */
export function detectChangedLevel(
	oldHeader: HeaderData,
	newHeader: HeaderData,
	oldPath: string,
): {
	level: 'month' | 'type' | 'cycle' | 'case' | null;
	oldName: string;
	newName: string;
} | null {
	// Se não tem caminho antigo, não há o que renomear
	if (!oldPath) return null;

	// Verifica cada nível de baixo para cima (caso é o mais específico)
	if (oldHeader.testCase !== newHeader.testCase) {
		return {
			level: 'case',
			oldName: oldHeader.testCase,
			newName: newHeader.testCase,
		};
	}

	if (oldHeader.testCycle !== newHeader.testCycle) {
		return {
			level: 'cycle',
			oldName: oldHeader.testCycle,
			newName: newHeader.testCycle,
		};
	}

	// Verifica mudança no tipo OU no valor do tipo
	if (
		oldHeader.testType !== newHeader.testType ||
		oldHeader.testTypeValue !== newHeader.testTypeValue
	) {
		// Reconstroi nome da pasta com prefixo correto
		let oldTypeFolderName = oldHeader.testTypeValue;
		if (oldHeader.testType === 'regressivo') {
			oldTypeFolderName = `regressivo-${oldHeader.testTypeValue}`;
		} else if (oldHeader.testType === 'gmud') {
			oldTypeFolderName = `gmud-${oldHeader.testTypeValue}`;
		}

		let newTypeFolderName = newHeader.testTypeValue;
		if (newHeader.testType === 'regressivo') {
			newTypeFolderName = `regressivo-${newHeader.testTypeValue}`;
		} else if (newHeader.testType === 'gmud') {
			newTypeFolderName = `gmud-${newHeader.testTypeValue}`;
		}

		return {
			level: 'type',
			oldName: oldTypeFolderName,
			newName: newTypeFolderName,
		};
	}

	// Mês raramente muda (apenas se virar mês enquanto app aberto)
	const oldMonth = oldPath.split(path.sep)[oldPath.split(path.sep).length - 4];
	const currentMonth = getMonthFolderName();
	if (oldMonth !== currentMonth) {
		return {
			level: 'month',
			oldName: oldMonth,
			newName: currentMonth,
		};
	}

	return null;
}

/**
 * Reconstrói o caminho após renomeação de um nível específico
 *
 * @param oldPath - Caminho antigo completo
 * @param level - Nível que foi renomeado
 * @param newName - Novo nome para o nível
 * @returns Novo caminho completo
 */
export function rebuildPathAfterRename(
	oldPath: string,
	level: 'month' | 'type' | 'cycle' | 'case',
	newName: string,
): string {
	const parts = oldPath.split(path.sep);

	// Estrutura: [...]/rootFolder/mês/tipo/ciclo/caso
	// Índices relativos ao final: -4, -3, -2, -1
	switch (level) {
		case 'month':
			parts[parts.length - 4] = newName;
			break;
		case 'type':
			parts[parts.length - 3] = newName;
			break;
		case 'cycle':
			parts[parts.length - 2] = newName;
			break;
		case 'case':
			parts[parts.length - 1] = newName;
			break;
	}

	return parts.join(path.sep);
}

/**
 * Valida se um caminho segue a estrutura esperada
 * Útil para verificar se é uma pasta de teste válida
 */
export function isValidTestFolder(folderPath: string): boolean {
	if (!folderPath || !fileExists(folderPath)) {
		return false;
	}

	const parts = folderPath.split(path.sep);

	// Deve ter pelo menos 5 níveis: root/mês/tipo/ciclo/caso
	if (parts.length < 5) {
		return false;
	}

	// Valida formato do mês (MM-YYYY)
	const monthPart = parts[parts.length - 4];
	const monthRegex = /^\d{2}-\d{4}$/;

	return monthRegex.test(monthPart);
}
