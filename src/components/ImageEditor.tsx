/**
 * ImageEditor Component
 *
 * Editor de imagens com ferramentas de anotação usando Fabric.js
 * Refatorado para usar hooks customizados e componentes menores
 */

import { useEffect, useRef, useState } from 'react';
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
	// Unsaved-changes guard for image switching
	pendingImage?: ImageData | null;
	onSwitchReady?: (image: ImageData) => void;
	onSwitchCancelled?: () => void;
	onHasUnsavedChangesChange?: (hasChanges: boolean) => void;
}

export default function ImageEditor({
	image,
	onClose,
	onSave,
	pendingImage,
	onSwitchReady,
	onSwitchCancelled,
	onHasUnsavedChangesChange,
}: ImageEditorProps) {
	const { t } = useLanguage();
	const containerRef = useRef<HTMLDivElement>(null);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	// 'close' = triggered by close button, 'switch' = triggered by image switch request
	const [dialogMode, setDialogMode] = useState<'close' | 'switch'>('close');

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
		setCurrentTool, // BUG FIX: Permite voltar ao select após desenhar
	});

	// ==================== EFFECTS ====================

	// Notify parent when unsaved-changes state changes
	useEffect(() => {
		onHasUnsavedChangesChange?.(hasUnsavedChanges);
	}, [hasUnsavedChanges, onHasUnsavedChangesChange]);

	// When parent requests a switch to another image, show the confirm dialog or proceed immediately
	useEffect(() => {
		if (!pendingImage) return;
		if (hasUnsavedChanges) {
			setDialogMode('switch');
			setShowConfirmDialog(true);
		} else {
			onSwitchReady?.(pendingImage);
		}
	}, [pendingImage]); // eslint-disable-line react-hooks/exhaustive-deps

	// ==================== EVENT HANDLERS ====================

	const handleSave = () => {
		const dataUrl = getDataURL();
		if (dataUrl) {
			onSave(dataUrl);
			resetChanges();
			onClose(); // BUG FIX: Fecha editor após salvar
		}
	};

	const handleCloseAttempt = () => {
		if (hasUnsavedChanges) {
			setDialogMode('close');
			setShowConfirmDialog(true);
		} else {
			onClose();
		}
	};

	const handleConfirmSave = () => {
		setShowConfirmDialog(false);
		if (dialogMode === 'switch' && pendingImage) {
			// Save current then switch
			const dataUrl = getDataURL();
			if (dataUrl) {
				onSave(dataUrl);
				resetChanges();
			}
			onSwitchReady?.(pendingImage);
		} else {
			handleSave();
		}
	};

	const handleConfirmDiscard = () => {
		setShowConfirmDialog(false);
		if (dialogMode === 'switch' && pendingImage) {
			onSwitchReady?.(pendingImage);
		} else {
			onClose();
		}
	};

	const handleConfirmCancel = () => {
		setShowConfirmDialog(false);
		if (dialogMode === 'switch') {
			onSwitchCancelled?.();
		}
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
			<div ref={containerRef} className="flex-1 p-4 overflow-auto">
				<canvas ref={canvasRef} />
			</div>

			{/* Confirmation Dialog */}
			<ConfirmationDialog
				isOpen={showConfirmDialog}
				title={t('confirmUnsavedTitle')}
				message={
					dialogMode === 'switch'
						? t('confirmUnsavedSwitchMessage')
						: t('confirmUnsavedMessage')
				}
				onSave={handleConfirmSave}
				onDiscard={handleConfirmDiscard}
				onCancel={handleConfirmCancel}
			/>
		</div>
	);
}
