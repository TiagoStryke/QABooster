/**
 * useToolbarState Hook
 *
 * Gerencia estados e lógica da toolbar (displays, área fixa, orientação PDF)
 */

import { useEffect, useState } from 'react';
import { ipcService } from '../services/ipc-service';

const { ipcRenderer } = window.require('electron');

export interface Display {
	id: number;
	label: string;
	bounds: { x: number; y: number; width: number; height: number };
	primary: boolean;
}

export function useToolbarState(t: (key: string) => string) {
	// ==================== STATES ====================

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

	// ==================== PDF ORIENTATION LISTENER ====================

	useEffect(() => {
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

	// ==================== DISPLAYS & AREA LISTENERS ====================

	useEffect(() => {
		// Carregar displays
		ipcService.getDisplays().then((displays: Display[]) => {
			setDisplays(displays);
		});

		// Listeners
		const handleDisplaysUpdated = (_: any, updatedDisplays: Display[]) => {
			setDisplays(updatedDisplays);
		};

		const handleDisplayChanged = (_: any, newDisplayId: number) => {
			setSelectedDisplay(newDisplayId);
			localStorage.setItem('qabooster-display', newDisplayId.toString());
		};

		const handleAreaSaved = (_: any, area: any) => {
			setIsSelectingArea(false);
			setHasAreaDefined(true);
			alert(`${t('areaSaved')}: ${area.width}x${area.height}px`);
			setUseSavedArea(true);
			localStorage.setItem('qabooster-use-saved-area', 'true');
			ipcService.setUseSavedArea(true);
		};

		const handleAreaCancelled = () => {
			setIsSelectingArea(false);
		};

		ipcRenderer.on('displays-updated', handleDisplaysUpdated);
		ipcRenderer.on('display-changed', handleDisplayChanged);
		ipcRenderer.on('area-saved-with-confirmation', handleAreaSaved);
		ipcRenderer.on('area-selection-cancelled', handleAreaCancelled);

		// Setup inicial
		ipcService.setUseSavedArea(useSavedArea);
		ipcService.setDisplay(selectedDisplay);

		// Verificar área salva
		ipcService.getSavedArea().then((area: any) => {
			setHasAreaDefined(area !== null);
		});

		return () => {
			ipcRenderer.removeAllListeners('area-saved-with-confirmation');
			ipcRenderer.removeAllListeners('area-selection-cancelled');
			ipcRenderer.removeAllListeners('displays-updated');
			ipcRenderer.removeAllListeners('display-changed');
		};
	}, []);

	// ==================== HANDLERS ====================

	const handleDisplayChange = async (displayId: number) => {
		setSelectedDisplay(displayId);
		await ipcService.setDisplay(displayId);
		localStorage.setItem('qabooster-display', displayId.toString());
	};

	const handleSelectArea = async () => {
		setIsSelectingArea(true);
		await ipcService.openAreaSelector();
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
			ipcService.setUseSavedArea(false);
			ipcService.saveSelectedArea(null);
		}
	};

	// ==================== RETURN ====================

	return {
		displays,
		selectedDisplay,
		isSelectingArea,
		useSavedArea,
		hasAreaDefined,
		pdfOrientation,
		handleDisplayChange,
		handleAreaButtonClick,
	};
}
