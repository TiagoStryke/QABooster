/**
 * ImageEditor Component
 *
 * Editor de imagens com ferramentas de anotação usando Fabric.js
 * Refatorado para usar hooks customizados e componentes menores
 */

import { useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useEditorCanvas } from '../hooks/useEditorCanvas';
import { useEditorState } from '../hooks/useEditorState';
import type { ImageData } from '../interfaces';
import ConfirmationDialog from './ConfirmationDialog';
import EditorToolbar from './EditorToolbar';

interface ImageEditorProps {
	image: ImageData;
	onClose: () => void;
	onSave: (dataUrl: string) => void;
}

export default function ImageEditor({
	image,
	onClose,
	onSave,
}: ImageEditorProps) {
	const { t } = useLanguage();
	const containerRef = useRef<HTMLDivElement>(null);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);

	// Editor state management (tool, color, zoom, changes)
	const {
		currentTool,
		setCurrentTool,
		color,
		setColor,
		zoom,
		setZoom,
		hasUnsavedChanges,
		markAsChanged,
		resetChanges,
	} = useEditorState();

	// Canvas management (Fabric.js, drawing tools)
	const {
		canvasRef,
		handleZoomIn,
		handleZoomOut,
		handleZoomReset,
		deleteSelected,
		getDataURL,
	} = useEditorCanvas({
		image,
		currentTool,
		color,
		zoom,
		setZoom,
		markAsChanged,
		containerRef,
	});

	// ==================== EVENT HANDLERS ====================

	const handleSave = () => {
		const dataUrl = getDataURL();
		if (dataUrl) {
			onSave(dataUrl);
			resetChanges();
		}
	};

	const handleCloseAttempt = () => {
		if (hasUnsavedChanges) {
			setShowConfirmDialog(true);
		} else {
			onClose();
		}
	};

	const handleConfirmSave = () => {
		setShowConfirmDialog(false);
		handleSave();
	};

	const handleConfirmDiscard = () => {
		setShowConfirmDialog(false);
		onClose();
	};

	const handleConfirmCancel = () => {
		setShowConfirmDialog(false);
	};

	// ==================== RENDER ====================

	return (
		<div className="flex-1 bg-slate-900 flex flex-col overflow-hidden">
			{/* Toolbar */}
			<EditorToolbar
				currentTool={currentTool}
				onToolChange={setCurrentTool}
				color={color}
				onColorChange={setColor}
				zoom={zoom}
				onZoomIn={handleZoomIn}
				onZoomOut={handleZoomOut}
				onZoomReset={handleZoomReset}
				onDelete={deleteSelected}
				onSave={handleSave}
				onClose={handleCloseAttempt}
			/>

			{/* Canvas Container */}
			<div
				ref={containerRef}
				className="flex-1 p-4 overflow-auto"
				style={{ backgroundColor: '#1e293b' }}
			>
				<canvas ref={canvasRef} />
			</div>

			{/* Confirmation Dialog */}
			<ConfirmationDialog
				isOpen={showConfirmDialog}
				title={t('confirmUnsavedTitle')}
				message={t('confirmUnsavedMessage')}
				onSave={handleConfirmSave}
				onDiscard={handleConfirmDiscard}
				onCancel={handleConfirmCancel}
			/>
		</div>
	);
}
