/**
 * useEditorState Hook
 *
 * Gerencia o estado do editor de imagens:
 * - Ferramenta atual (select, arrow, line, etc)
 * - Cor selecionada
 * - Nível de zoom
 * - Mudanças não salvas
 */

import { useEffect, useState } from 'react';

export type Tool =
	| 'select'
	| 'arrow'
	| 'line'
	| 'rectangle'
	| 'circle'
	| 'text'
	| 'pen'
	| 'sticker-click'
	| 'sticker-thumbsdown';

export function useEditorState() {
	const [currentTool, setCurrentTool] = useState<Tool>('select');
	const [color, setColor] = useState(
		localStorage.getItem('lastEditorColor') || '#FF0000',
	);
	const [zoom, setZoom] = useState(1);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

	// Salva a cor no localStorage quando ela mudar
	useEffect(() => {
		localStorage.setItem('lastEditorColor', color);
	}, [color]);

	// Marca como mudança não salva quando adicionar objetos
	const markAsChanged = () => {
		setHasUnsavedChanges(true);
	};

	// Resetar estado de mudanças
	const resetChanges = () => {
		setHasUnsavedChanges(false);
	};

	return {
		currentTool,
		setCurrentTool,
		color,
		setColor,
		zoom,
		setZoom,
		hasUnsavedChanges,
		markAsChanged,
		resetChanges,
	};
}
