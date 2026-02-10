/**
 * useTestTypeHistory Hook
 *
 * Gerencia histórico de valores de tipo de teste (Regressivo/GMUD) para autocomplete
 * Salva valores específicos por tipo quando PDF é gerado e mantém lista única
 * Similar ao useSystemHistory, mas separado por tipo de teste
 */

import { useCallback, useEffect, useState } from 'react';
import { TestType } from '../interfaces';

const STORAGE_KEY_PREFIX = 'qabooster-testtype-history';
const MAX_HISTORY_ITEMS = 15; // Mantém apenas os 15 mais recentes por tipo

interface TestTypeHistoryMap {
	regressivo: string[];
	gmud: string[];
}

export function useTestTypeHistory() {
	const [history, setHistory] = useState<TestTypeHistoryMap>({
		regressivo: [],
		gmud: [],
	});

	// Carrega histórico do localStorage ao montar
	useEffect(() => {
		const loadHistory = () => {
			const regressivoKey = `${STORAGE_KEY_PREFIX}-regressivo`;
			const gmudKey = `${STORAGE_KEY_PREFIX}-gmud`;

			const regressivoStored = localStorage.getItem(regressivoKey);
			const gmudStored = localStorage.getItem(gmudKey);

			const regressivoData = regressivoStored
				? JSON.parse(regressivoStored)
				: [];
			const gmudData = gmudStored ? JSON.parse(gmudStored) : [];

			setHistory({
				regressivo: Array.isArray(regressivoData) ? regressivoData : [],
				gmud: Array.isArray(gmudData) ? gmudData : [],
			});
		};

		loadHistory();
	}, []);

	// Adiciona novo valor ao histórico de um tipo específico
	const addToHistory = useCallback(
		(testType: TestType, value: string) => {
			if (!value || !value.trim()) return;
			if (testType !== 'regressivo' && testType !== 'gmud') return;

			const normalizedValue = value.trim();
			const storageKey = `${STORAGE_KEY_PREFIX}-${testType}`;

			setHistory((prev) => {
				const currentList = prev[testType];

				// Remove duplicatas (case-insensitive)
				const filtered = currentList.filter(
					(item) => item.toLowerCase() !== normalizedValue.toLowerCase(),
				);

				// Adiciona no início (mais recente primeiro)
				const updated = [normalizedValue, ...filtered];

				// Limita tamanho mantendo apenas os mais recentes
				const limited = updated.slice(0, MAX_HISTORY_ITEMS);

				// Salva no localStorage
				localStorage.setItem(storageKey, JSON.stringify(limited));

				return {
					...prev,
					[testType]: limited,
				};
			});
		},
		[],
	);

	// Retorna histórico para um tipo específico
	const getHistoryForType = useCallback(
		(testType: TestType): string[] => {
			if (testType === 'regressivo') return history.regressivo;
			if (testType === 'gmud') return history.gmud;
			return [];
		},
		[history],
	);

	// Limpa histórico de um tipo específico
	const clearHistoryForType = useCallback((testType: TestType) => {
		if (testType !== 'regressivo' && testType !== 'gmud') return;

		const storageKey = `${STORAGE_KEY_PREFIX}-${testType}`;
		localStorage.removeItem(storageKey);

		setHistory((prev) => ({
			...prev,
			[testType]: [],
		}));
	}, []);

	return {
		history,
		addToHistory,
		getHistoryForType,
		clearHistoryForType,
	};
}
