/**
 * useAppSettings Hook
 *
 * Gerencia configurações globais da aplicação (rootFolder, executorName)
 * Salva no localStorage e sincroniza com o processo principal
 */

import { useCallback, useEffect, useState } from 'react';
import { AppSettings } from '../interfaces';
import { ipcService } from '../services/ipc-service';

const STORAGE_KEY = 'qabooster-app-settings';

const DEFAULT_SETTINGS: AppSettings = {
	rootFolder: '',
	executorName: '',
};

export function useAppSettings() {
	const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

	// Carrega settings do localStorage ao montar
	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				setSettings({
					rootFolder: parsed.rootFolder || '',
					executorName: parsed.executorName || '',
				});
			} catch (error) {
				console.error('Error loading app settings:', error);
				setSettings(DEFAULT_SETTINGS);
			}
		}
	}, []);

	// Salva settings no localStorage
	const saveSettings = useCallback((newSettings: AppSettings) => {
		setSettings(newSettings);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
	}, []);

	// Atualiza pasta raiz
	const setRootFolder = useCallback(
		async (selectNew = false) => {
			if (selectNew) {
				// Abre dialog para selecionar pasta
				const folder = await ipcService.selectFolder();
				if (folder) {
					const newSettings = { ...settings, rootFolder: folder };
					saveSettings(newSettings);
					return folder;
				}
				return null;
			} else {
				// Apenas atualiza estado
				const newSettings = { ...settings, rootFolder: '' };
				saveSettings(newSettings);
				return null;
			}
		},
		[settings, saveSettings],
	);

	// Atualiza nome do executor
	const setExecutorName = useCallback(
		(name: string) => {
			const newSettings = { ...settings, executorName: name };
			saveSettings(newSettings);
		},
		[settings, saveSettings],
	);

	// Verifica se settings estão completas
	const isConfigured = useCallback(() => {
		return settings.rootFolder !== '' && settings.executorName !== '';
	}, [settings]);

	return {
		settings,
		setRootFolder,
		setExecutorName,
		isConfigured,
	};
}
