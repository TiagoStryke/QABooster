/**
 * useSystemHistory Hook
 *
 * Gerencia histórico de sistemas usados para autocomplete
 * Salva sistemas quando PDF é gerado e mantém lista única
 */

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'qabooster-system-history';
const MAX_HISTORY_ITEMS = 20; // Mantém apenas os 20 mais recentes

export function useSystemHistory() {
	const [history, setHistory] = useState<string[]>([]);

	// Carrega histórico do localStorage ao montar
	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				setHistory(Array.isArray(parsed) ? parsed : []);
			} catch (error) {
				console.error('Error loading system history:', error);
				setHistory([]);
			}
		}
	}, []);

	// Adiciona novo sistema ao histórico
	const addToHistory = useCallback((system: string) => {
		if (!system || !system.trim()) return;

		const normalizedSystem = system.trim();

		setHistory((prev) => {
			// Remove duplicatas (case-insensitive)
			const filtered = prev.filter(
				(item) => item.toLowerCase() !== normalizedSystem.toLowerCase(),
			);

			// Adiciona no início (mais recente primeiro)
			const updated = [normalizedSystem, ...filtered];

			// Limita tamanho mantendo apenas os mais recentes
			const limited = updated.slice(0, MAX_HISTORY_ITEMS);

			// Salva no localStorage
			localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));

			return limited;
		});
	}, []);

	// Limpa todo o histórico (útil para settings futuras)
	const clearHistory = useCallback(() => {
		setHistory([]);
		localStorage.removeItem(STORAGE_KEY);
	}, []);

	return {
		history,
		addToHistory,
		clearHistory,
	};
}
