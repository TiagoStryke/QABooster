import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'qabooster-system-history';
const MAX_HISTORY_ITEMS = 15;

export function useSystemHistory() {
	const [history, setHistory] = useState<string[]>([]);

	// Carrega histórico do localStorage na inicialização
	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				setHistory(Array.isArray(parsed) ? parsed : []);
			} catch (error) {
				console.error('[useSystemHistory] Error parsing history:', error);
				setHistory([]);
			}
		}
	}, []);

	// Adiciona novo item ao histórico (só quando terminar de digitar)
	const addToHistory = useCallback((value: string) => {
		if (!value || value.trim().length < 3) {
			return; // Não salva textos vazios ou muito curtos
		}

		const trimmedValue = value.trim();

		setHistory((prev) => {
			// Remove duplicatas (case insensitive)
			const filtered = prev.filter(
				(item) => item.toLowerCase() !== trimmedValue.toLowerCase(),
			);

			// Adiciona no início da lista
			const newHistory = [trimmedValue, ...filtered].slice(
				0,
				MAX_HISTORY_ITEMS,
			);

			// Persiste no localStorage
			localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));

			return newHistory;
		});
	}, []);

	// Remove item do histórico
	const removeFromHistory = useCallback((value: string) => {
		setHistory((prev) => {
			const newHistory = prev.filter((item) => item !== value);

			// Atualiza localStorage
			localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));

			return newHistory;
		});
	}, []);

	// Filtra histórico baseado no texto digitado
	const filterHistory = useCallback(
		(inputValue: string) => {
			if (!inputValue || inputValue.trim().length === 0) {
				return history; // Mostra todos se não digitou nada
			}

			const searchTerm = inputValue.toLowerCase().trim();
			return history.filter((item) => item.toLowerCase().includes(searchTerm));
		},
		[history],
	);

	return {
		history,
		addToHistory,
		removeFromHistory,
		filterHistory,
	};
}
