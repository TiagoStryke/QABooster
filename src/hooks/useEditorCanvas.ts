/**
 * useEditorCanvas Hook
 *
 * Gerencia o Fabric.js canvas e todas as ferramentas de desenho:
 * - Inicialização do canvas
 * - Carregamento da imagem
 * - Ferramentas: arrow, circle, rectangle, line, text, pen, stickers
 * - Controles de zoom
 * - Delete de objetos
 */

import { fabric } from 'fabric';
import { useEffect, useRef } from 'react';
import type { ImageData } from '../interfaces';
import { ipcService } from '../services/ipc-service';
import type { Tool } from './useEditorState';

// Import stickers
import clickSticker from '../assets/stickers/click.png';
import thumbsDownSticker from '../assets/stickers/thumbs-down.png';

interface UseEditorCanvasProps {
	image: ImageData;
	currentTool: Tool;
	color: string;
	zoom: number;
	setZoom: (zoom: number) => void;
	markAsChanged: () => void;
	containerRef: React.RefObject<HTMLDivElement>;
}

export function useEditorCanvas({
	image,
	currentTool,
	color,
	zoom,
	setZoom,
	markAsChanged,
	containerRef,
}: UseEditorCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
	const backgroundImageRef = useRef<fabric.Image | null>(null);

	// Inicializa canvas e carrega imagem
	useEffect(() => {
		if (!canvasRef.current) return;

		const canvas = new fabric.Canvas(canvasRef.current, {
			backgroundColor: '#1e293b',
		});

		fabricCanvasRef.current = canvas;

		// Load image via base64
		const loadImage = async () => {
			const base64 = await ipcService.readImageAsBase64(image.path);
			if (!base64) return;

			fabric.Image.fromURL(base64, (img: fabric.Image) => {
				if (!img) return;

				// Usa tamanho ORIGINAL da imagem sem redimensionar
				const imgWidth = img.width!;
				const imgHeight = img.height!;

				// Define canvas com tamanho original da imagem
				canvas.setDimensions({ width: imgWidth, height: imgHeight });

				img.set({
					left: 0,
					top: 0,
					selectable: false,
					evented: false,
				});

				backgroundImageRef.current = img;
				canvas.add(img);
				canvas.sendToBack(img);
				canvas.renderAll();

				// Calcula zoom inicial para caber na tela
				if (containerRef.current) {
					const containerWidth = containerRef.current.clientWidth;
					const containerHeight = containerRef.current.clientHeight;
					const initialZoom = Math.min(
						containerWidth / imgWidth,
						containerHeight / imgHeight,
						1, // Não aumenta além de 100%
					);
					setZoom(initialZoom);
					canvas.setZoom(initialZoom);
				}
			});
		};

		loadImage();

		// Rastreia mudanças no canvas
		canvas.on('object:added', markAsChanged);
		canvas.on('object:modified', markAsChanged);
		canvas.on('object:removed', markAsChanged);

		return () => {
			canvas.off('object:added', markAsChanged);
			canvas.off('object:modified', markAsChanged);
			canvas.off('object:removed', markAsChanged);
			canvas.dispose();
		};
	}, [image]);

	// Zoom controls
	const handleZoomIn = () => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;
		const newZoom = Math.min(zoom * 1.2, 3); // Max 300%
		setZoom(newZoom);
		canvas.setZoom(newZoom);
		canvas.renderAll();
	};

	const handleZoomOut = () => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;
		const newZoom = Math.max(zoom / 1.2, 0.1); // Min 10%
		setZoom(newZoom);
		canvas.setZoom(newZoom);
		canvas.renderAll();
	};

	const handleZoomReset = () => {
		const canvas = fabricCanvasRef.current;
		if (!canvas || !containerRef.current || !backgroundImageRef.current) return;

		const imgWidth = backgroundImageRef.current.width!;
		const imgHeight = backgroundImageRef.current.height!;
		const containerWidth = containerRef.current.clientWidth;
		const containerHeight = containerRef.current.clientHeight;

		const fitZoom = Math.min(
			containerWidth / imgWidth,
			containerHeight / imgHeight,
			1,
		);

		setZoom(fitZoom);
		canvas.setZoom(fitZoom);
		canvas.renderAll();
	};

	// Delete selected object
	const deleteSelected = () => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		const active = canvas.getActiveObject();
		if (active && active !== backgroundImageRef.current) {
			canvas.remove(active);
			canvas.renderAll();
		}
	};

	// Get canvas data URL
	const getDataURL = (): string | null => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return null;
		return canvas.toDataURL({ format: 'png', quality: 1 });
	};

	// ==================== DRAWING TOOLS ====================

	const addArrow = () => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		let isDrawing = false;
		let startX = 0;
		let startY = 0;
		let arrowGroup: fabric.Group | null = null;

		const onMouseDown = (e: any) => {
			const pointer = canvas.getPointer(e.e);
			isDrawing = true;
			startX = pointer.x;
			startY = pointer.y;
		};

		const onMouseMove = (e: any) => {
			if (!isDrawing) return;

			const pointer = canvas.getPointer(e.e);

			// Remove arrow anterior
			if (arrowGroup) {
				canvas.remove(arrowGroup);
			}

			// Calcula comprimento mínimo para a seta
			const dx = pointer.x - startX;
			const dy = pointer.y - startY;
			const length = Math.sqrt(dx * dx + dy * dy);

			// Tamanho mínimo de 100px para a seta
			if (length < 100) return;

			// Cria linha
			const line = new fabric.Line([startX, startY, pointer.x, pointer.y], {
				stroke: color,
				strokeWidth: 4,
				selectable: false,
				evented: false,
			});

			// Calcula ângulo para a ponta da seta
			const angle =
				(Math.atan2(pointer.y - startY, pointer.x - startX) * 180) / Math.PI;

			// Cria ponta da seta (maior)
			const arrowHead = new fabric.Triangle({
				left: pointer.x,
				top: pointer.y,
				width: 25,
				height: 30,
				fill: color,
				angle: angle + 90,
				originX: 'center',
				originY: 'center',
				selectable: false,
				evented: false,
			});

			arrowGroup = new fabric.Group([line, arrowHead], {
				selectable: false,
				evented: false,
			});

			canvas.add(arrowGroup);
			canvas.renderAll();
		};

		const onMouseUp = () => {
			if (!isDrawing) return;
			isDrawing = false;

			// Torna o grupo selecionável
			if (arrowGroup) {
				arrowGroup.set({ selectable: true, evented: true });
				canvas.setActiveObject(arrowGroup);
			}

			// Remove event listeners
			canvas.off('mouse:down', onMouseDown);
			canvas.off('mouse:move', onMouseMove);
			canvas.off('mouse:up', onMouseUp);

			canvas.renderAll();
		};

		canvas.on('mouse:down', onMouseDown);
		canvas.on('mouse:move', onMouseMove);
		canvas.on('mouse:up', onMouseUp);
	};

	const addCircle = () => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		let isDrawing = false;
		let startX = 0;
		let startY = 0;
		let circle: fabric.Circle | null = null;

		const onMouseDown = (e: any) => {
			const pointer = canvas.getPointer(e.e);
			isDrawing = true;
			startX = pointer.x;
			startY = pointer.y;
		};

		const onMouseMove = (e: any) => {
			if (!isDrawing) return;

			const pointer = canvas.getPointer(e.e);

			if (circle) {
				canvas.remove(circle);
			}

			const radius =
				Math.sqrt(
					Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2),
				) / 2;

			circle = new fabric.Circle({
				left: Math.min(pointer.x, startX),
				top: Math.min(pointer.y, startY),
				radius,
				stroke: color,
				strokeWidth: 4,
				fill: 'transparent',
				selectable: false,
				evented: false,
			});

			canvas.add(circle);
			canvas.renderAll();
		};

		const onMouseUp = () => {
			if (!isDrawing || !circle) return;
			isDrawing = false;

			circle.set({ selectable: true, evented: true });
			canvas.setActiveObject(circle);

			canvas.off('mouse:down', onMouseDown);
			canvas.off('mouse:move', onMouseMove);
			canvas.off('mouse:up', onMouseUp);

			canvas.renderAll();
		};

		canvas.on('mouse:down', onMouseDown);
		canvas.on('mouse:move', onMouseMove);
		canvas.on('mouse:up', onMouseUp);
	};

	const addRectangle = () => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		let isDrawing = false;
		let startX = 0;
		let startY = 0;
		let rect: fabric.Rect | null = null;

		const onMouseDown = (e: any) => {
			const pointer = canvas.getPointer(e.e);
			isDrawing = true;
			startX = pointer.x;
			startY = pointer.y;
		};

		const onMouseMove = (e: any) => {
			if (!isDrawing) return;

			const pointer = canvas.getPointer(e.e);

			if (rect) {
				canvas.remove(rect);
			}

			rect = new fabric.Rect({
				left: Math.min(pointer.x, startX),
				top: Math.min(pointer.y, startY),
				width: Math.abs(pointer.x - startX),
				height: Math.abs(pointer.y - startY),
				stroke: color,
				strokeWidth: 4,
				fill: 'transparent',
				selectable: false,
				evented: false,
			});

			canvas.add(rect);
			canvas.renderAll();
		};

		const onMouseUp = () => {
			if (!isDrawing || !rect) return;
			isDrawing = false;

			rect.set({ selectable: true, evented: true });
			canvas.setActiveObject(rect);

			canvas.off('mouse:down', onMouseDown);
			canvas.off('mouse:move', onMouseMove);
			canvas.off('mouse:up', onMouseUp);

			canvas.renderAll();
		};

		canvas.on('mouse:down', onMouseDown);
		canvas.on('mouse:move', onMouseMove);
		canvas.on('mouse:up', onMouseUp);
	};

	const addLine = () => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		let isDrawing = false;
		let startX = 0;
		let startY = 0;
		let line: fabric.Line | null = null;

		const onMouseDown = (e: any) => {
			const pointer = canvas.getPointer(e.e);
			isDrawing = true;
			startX = pointer.x;
			startY = pointer.y;
		};

		const onMouseMove = (e: any) => {
			if (!isDrawing) return;

			const pointer = canvas.getPointer(e.e);

			if (line) {
				canvas.remove(line);
			}

			line = new fabric.Line([startX, startY, pointer.x, pointer.y], {
				stroke: color,
				strokeWidth: 4,
				selectable: false,
				evented: false,
			});

			canvas.add(line);
			canvas.renderAll();
		};

		const onMouseUp = () => {
			if (!isDrawing || !line) return;
			isDrawing = false;

			line.set({ selectable: true, evented: true });
			canvas.setActiveObject(line);

			canvas.off('mouse:down', onMouseDown);
			canvas.off('mouse:move', onMouseMove);
			canvas.off('mouse:up', onMouseUp);

			canvas.renderAll();
		};

		canvas.on('mouse:down', onMouseDown);
		canvas.on('mouse:move', onMouseMove);
		canvas.on('mouse:up', onMouseUp);
	};

	const addText = () => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		const text = new fabric.IText('Digite aqui', {
			left: 100,
			top: 100,
			fill: color,
			fontSize: 32,
			fontFamily: 'Arial',
		});

		canvas.add(text);
		canvas.setActiveObject(text);
		text.enterEditing();
		canvas.renderAll();
	};

	const enableFreeDrawing = () => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		canvas.isDrawingMode = true;
		canvas.freeDrawingBrush.color = color;
		canvas.freeDrawingBrush.width = 4;
	};

	const disableFreeDrawing = () => {
		const canvas = fabricCanvasRef.current;
		if (canvas) {
			canvas.isDrawingMode = false;
		}
	};

	const addSticker = (type: 'click' | 'thumbsdown') => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		const stickerUrl = type === 'click' ? clickSticker : thumbsDownSticker;

		fabric.Image.fromURL(stickerUrl, (img: fabric.Image) => {
			img.scale(0.3);
			img.set({
				left: 100,
				top: 100,
			});
			canvas.add(img);
			canvas.setActiveObject(img);
			canvas.renderAll();
		});
	};

	// Tool change handler
	const handleToolChange = (tool: Tool) => {
		disableFreeDrawing();

		switch (tool) {
			case 'arrow':
				addArrow();
				break;
			case 'circle':
				addCircle();
				break;
			case 'rectangle':
				addRectangle();
				break;
			case 'line':
				addLine();
				break;
			case 'text':
				addText();
				break;
			case 'pen':
				enableFreeDrawing();
				break;
			case 'sticker-click':
				addSticker('click');
				break;
			case 'sticker-thumbsdown':
				addSticker('thumbsdown');
				break;
		}
	};

	// Trigger tool change when currentTool changes
	useEffect(() => {
		if (currentTool !== 'select' && currentTool !== 'pen') {
			handleToolChange(currentTool);
		} else if (currentTool === 'pen') {
			enableFreeDrawing();
		} else {
			disableFreeDrawing();
		}
	}, [currentTool]);

	// Update brush color when color changes
	useEffect(() => {
		const canvas = fabricCanvasRef.current;
		if (canvas && canvas.isDrawingMode) {
			canvas.freeDrawingBrush.color = color;
		}
	}, [color]);

	return {
		canvasRef,
		handleZoomIn,
		handleZoomOut,
		handleZoomReset,
		deleteSelected,
		getDataURL,
	};
}
