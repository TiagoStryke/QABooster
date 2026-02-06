import { fabric } from 'fabric';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ImageData } from '../interfaces';
import { ipcService } from '../services/ipc-service';
import ConfirmationDialog from './ConfirmationDialog';

// Import stickers
import clickSticker from '../assets/stickers/click.png';
import thumbsDownSticker from '../assets/stickers/thumbs-down.png';

interface ImageEditorProps {
	image: ImageData;
	onClose: () => void;
	onSave: (dataUrl: string) => void;
}

type Tool =
	| 'select'
	| 'arrow'
	| 'line'
	| 'rectangle'
	| 'circle'
	| 'text'
	| 'pen'
	| 'sticker-click'
	| 'sticker-thumbsdown';

export default function ImageEditor({
	image,
	onClose,
	onSave,
}: ImageEditorProps) {
	const { t } = useLanguage();
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
	const backgroundImageRef = useRef<fabric.Image | null>(null);
	const [currentTool, setCurrentTool] = useState<Tool>('select');
	const [color, setColor] = useState(
		localStorage.getItem('lastEditorColor') || '#FF0000',
	);
	const [zoom, setZoom] = useState(1);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);

	// Salva a cor no localStorage quando ela mudar
	useEffect(() => {
		localStorage.setItem('lastEditorColor', color);
	}, [color]);

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
		const handleCanvasChange = () => {
			setHasUnsavedChanges(true);
		};

		canvas.on('object:added', handleCanvasChange);
		canvas.on('object:modified', handleCanvasChange);
		canvas.on('object:removed', handleCanvasChange);

		return () => {
			canvas.off('object:added', handleCanvasChange);
			canvas.off('object:modified', handleCanvasChange);
			canvas.off('object:removed', handleCanvasChange);
			canvas.dispose();
		};
	}, [image]);

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

		// Reset scroll
		if (containerRef.current) {
			containerRef.current.scrollTop = 0;
			containerRef.current.scrollLeft = 0;
		}
	};

	const handleToolChange = (tool: Tool) => {
		setCurrentTool(tool);
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		canvas.isDrawingMode = false;
		canvas.selection = tool === 'select';

		if (tool === 'pen') {
			canvas.isDrawingMode = true;
			canvas.freeDrawingBrush.color = color;
			canvas.freeDrawingBrush.width = 3;
		}
	};

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
			handleToolChange('select');
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
				left: startX,
				top: startY,
				radius: radius,
				fill: 'transparent',
				stroke: color,
				strokeWidth: 3,
				originX: 'center',
				originY: 'center',
				selectable: false,
				evented: false,
			});

			canvas.add(circle);
			canvas.renderAll();
		};

		const onMouseUp = () => {
			if (!isDrawing) return;
			isDrawing = false;

			if (circle) {
				circle.set({ selectable: true, evented: true });
				canvas.setActiveObject(circle);
			}

			canvas.off('mouse:down', onMouseDown);
			canvas.off('mouse:move', onMouseMove);
			canvas.off('mouse:up', onMouseUp);

			canvas.renderAll();
			handleToolChange('select');
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

			const width = pointer.x - startX;
			const height = pointer.y - startY;

			rect = new fabric.Rect({
				left: startX,
				top: startY,
				width: Math.abs(width),
				height: Math.abs(height),
				fill: 'transparent',
				stroke: color,
				strokeWidth: 3,
				selectable: false,
				evented: false,
			});

			// Ajusta posição se arrastar para esquerda/cima
			if (width < 0) rect.set({ left: pointer.x });
			if (height < 0) rect.set({ top: pointer.y });

			canvas.add(rect);
			canvas.renderAll();
		};

		const onMouseUp = () => {
			if (!isDrawing) return;
			isDrawing = false;

			if (rect) {
				rect.set({ selectable: true, evented: true });
				canvas.setActiveObject(rect);
			}

			canvas.off('mouse:down', onMouseDown);
			canvas.off('mouse:move', onMouseMove);
			canvas.off('mouse:up', onMouseUp);

			canvas.renderAll();
			handleToolChange('select');
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
				strokeWidth: 3,
				selectable: false,
				evented: false,
			});

			canvas.add(line);
			canvas.renderAll();
		};

		const onMouseUp = () => {
			if (!isDrawing) return;
			isDrawing = false;

			if (line) {
				line.set({ selectable: true, evented: true });
				canvas.setActiveObject(line);
			}

			canvas.off('mouse:down', onMouseDown);
			canvas.off('mouse:move', onMouseMove);
			canvas.off('mouse:up', onMouseUp);

			canvas.renderAll();
			handleToolChange('select');
		};

		canvas.on('mouse:down', onMouseDown);
		canvas.on('mouse:move', onMouseMove);
		canvas.on('mouse:up', onMouseUp);
	};

	const addText = () => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		// Recupera último tamanho de texto usado (padrão: 48)
		const lastFontSize = parseInt(
			localStorage.getItem('lastTextFontSize') || '48',
			10,
		);

		const text = new fabric.IText('', {
			left: 100,
			top: 100,
			fill: color,
			fontSize: lastFontSize,
			fontFamily: 'Arial',
			selectable: true,
			editable: true,
			// Adiciona sombra sutil para dar destaque
			shadow: {
				color: 'rgba(0, 0, 0, 0.6)',
				blur: 4,
				offsetX: 2,
				offsetY: 2,
			} as fabric.Shadow,
		});

		// Salva o tamanho quando o texto for modificado
		text.on('modified', () => {
			if (text.fontSize) {
				localStorage.setItem('lastTextFontSize', text.fontSize.toString());
			}
		});

		canvas.add(text);
		canvas.setActiveObject(text);
		canvas.renderAll();

		// Entra em modo de edição após renderizar
		setTimeout(() => {
			text.enterEditing();
			canvas.renderAll();
		}, 10);
	};
	const addSticker = (stickerUrl: string) => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		fabric.Image.fromURL(stickerUrl, (img: fabric.Image) => {
			if (!img) return;

			// Define tamanho do sticker (ajuste conforme necessário)
			const maxSize = 150;
			const scale = Math.min(
				maxSize / (img.width || maxSize),
				maxSize / (img.height || maxSize),
			);

			img.set({
				left: 100,
				top: 100,
				scaleX: scale,
				scaleY: scale,
				selectable: true,
				evented: true,
			});

			canvas.add(img);
			canvas.setActiveObject(img);
			canvas.renderAll();
		});

		// Volta para select após adicionar
		handleToolChange('select');
	};

	const deleteSelected = () => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		const activeObject = canvas.getActiveObject();
		if (activeObject) {
			canvas.remove(activeObject);
			canvas.renderAll();
		}
	};

	const handleSave = () => {
		const canvas = fabricCanvasRef.current;
		if (!canvas || !backgroundImageRef.current) return;

		// Reset zoom to 1 before export to get original size
		const currentZoom = canvas.getZoom();
		canvas.setZoom(1);
		canvas.renderAll();

		// Export at original resolution
		const dataUrl = canvas.toDataURL({
			format: 'png',
			quality: 1,
			multiplier: 1, // Não multiplica, pega tamanho original
		});

		// Restore zoom
		canvas.setZoom(currentZoom);
		canvas.renderAll();

		setHasUnsavedChanges(false);
		onSave(dataUrl);
		onClose();
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

	const handleToolClick = (tool: Tool) => {
		handleToolChange(tool);

		if (tool === 'arrow') addArrow();
		else if (tool === 'line') addLine();
		else if (tool === 'rectangle') addRectangle();
		else if (tool === 'circle') addCircle();
		else if (tool === 'text') addText();
		else if (tool === 'sticker-click') addSticker(clickSticker);
		else if (tool === 'sticker-thumbsdown') addSticker(thumbsDownSticker);
	};

	return (
		<div className="flex-1 bg-slate-900 flex flex-col overflow-hidden">
			{/* Header compacto */}
			<div className="bg-slate-800 border-b border-slate-700 px-3 py-2 flex items-center justify-between">
				<div className="flex items-center gap-2 text-xs">
					<span className="font-medium text-slate-100">{t('imageEditor')}</span>
					<span className="text-slate-400">- {image.name}</span>
				</div>
				<button
					onClick={handleCloseAttempt}
					className="text-slate-400 hover:text-white p-1"
				>
					<svg
						className="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			{/* Toolbar compacta - estilo Teams */}
			<div className="bg-slate-800 border-b border-slate-700 px-3 py-1.5 flex items-center gap-1">
				<button
					onClick={() => handleToolChange('select')}
					className={`p-1.5 rounded hover:bg-slate-700 ${currentTool === 'select' ? 'bg-blue-600' : ''}`}
					title={t('select')}
				>
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15 15l-2 5L9 9l11 4-5 2z"
						/>
					</svg>
				</button>

				<button
					onClick={() => handleToolClick('arrow')}
					className={`p-1.5 rounded hover:bg-slate-700 ${currentTool === 'arrow' ? 'bg-blue-600' : ''}`}
					title={t('arrow')}
				>
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2.5}
							d="M17 8l4 4m0 0l-4 4m4-4H3"
						/>
					</svg>
				</button>

				<button
					onClick={() => handleToolClick('line')}
					className={`p-1.5 rounded hover:bg-slate-700 ${currentTool === 'line' ? 'bg-blue-600' : ''}`}
					title={t('line')}
				>
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2.5}
							d="M5 19L19 5"
						/>
					</svg>
				</button>

				<button
					onClick={() => handleToolClick('rectangle')}
					className={`p-1.5 rounded hover:bg-slate-700 ${currentTool === 'rectangle' ? 'bg-blue-600' : ''}`}
					title={t('rectangle')}
				>
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<rect x="4" y="6" width="16" height="12" rx="1" strokeWidth={2} />
					</svg>
				</button>

				<button
					onClick={() => handleToolClick('circle')}
					className={`p-1.5 rounded hover:bg-slate-700 ${currentTool === 'circle' ? 'bg-blue-600' : ''}`}
					title={t('circle')}
				>
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<circle cx="12" cy="12" r="9" strokeWidth={2} />
					</svg>
				</button>

				<button
					onClick={() => handleToolClick('text')}
					className={`p-1.5 rounded hover:bg-slate-700 ${currentTool === 'text' ? 'bg-blue-600' : ''}`}
					title={t('text')}
				>
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4 6h16M4 12h16M4 18h7"
						/>
					</svg>
				</button>

				<button
					onClick={() => handleToolClick('pen')}
					className={`p-1.5 rounded hover:bg-slate-700 ${currentTool === 'pen' ? 'bg-blue-600' : ''}`}
					title={t('pen')}
				>
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
						/>
					</svg>
				</button>

				<div className="w-px h-5 bg-slate-700 mx-1" />

				{/* Stickers */}
				<button
					onClick={() => handleToolClick('sticker-click')}
					className={`p-1.5 rounded hover:bg-slate-700 ${currentTool === 'sticker-click' ? 'bg-blue-600' : ''}`}
					title={t('stickerClick')}
				>
					<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 448 512">
						<path d="M128 40c0-22.1 17.9-40 40-40s40 17.9 40 40V188.2c8.5-7.6 19.7-12.2 32-12.2c20.6 0 38.2 13 45 31.2c8.8-9.3 21.2-15.2 35-15.2c25.3 0 46 19.5 47.9 44.3c8.5-7.7 19.8-12.3 32.1-12.3c26.5 0 48 21.5 48 48v48 16 48c0 70.7-57.3 128-128 128l-16 0H240l-.1 0h-5.2c-5 0-9.9-.3-14.7-1c-55.3-5.6-106.2-34-140-79L8 336c-13.3-17.7-9.7-42.7 8-56s42.7-9.7 56 8l56 74.7V40zM240 304c0-8.8-7.2-16-16-16s-16 7.2-16 16v96c0 8.8 7.2 16 16 16s16-7.2 16-16V304zm48-16c-8.8 0-16 7.2-16 16v96c0 8.8 7.2 16 16 16s16-7.2 16-16V304c0-8.8-7.2-16-16-16zm80 16c0-8.8-7.2-16-16-16s-16 7.2-16 16v96c0 8.8 7.2 16 16 16s16-7.2 16-16V304z" />
					</svg>
				</button>

				<button
					onClick={() => handleToolClick('sticker-thumbsdown')}
					className={`p-1.5 rounded hover:bg-slate-700 ${currentTool === 'sticker-thumbsdown' ? 'bg-blue-600' : ''}`}
					title={t('stickerThumbsDown')}
				>
					<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
						<path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
					</svg>
				</button>

				<div className="w-px h-5 bg-slate-700 mx-1" />

				<label className="text-xs text-slate-300 mr-1">{t('color')}:</label>
				<input
					type="color"
					value={color}
					onChange={(e) => setColor(e.target.value)}
					className="w-7 h-7 rounded cursor-pointer border border-slate-600"
				/>

				<div className="w-px h-5 bg-slate-700 mx-1" />

				{/* Zoom controls */}
				<button
					onClick={handleZoomOut}
					className="p-1.5 rounded hover:bg-slate-700"
					title={t('zoomOut')}
				>
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
						/>
					</svg>
				</button>

				<span className="text-xs text-slate-300 px-2">
					{Math.round(zoom * 100)}%
				</span>

				<button
					onClick={handleZoomIn}
					className="p-1.5 rounded hover:bg-slate-700"
					title={t('zoomIn')}
				>
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
						/>
					</svg>
				</button>

				<button
					onClick={handleZoomReset}
					className="p-1.5 rounded hover:bg-slate-700"
					title={t('fitToScreen')}
				>
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
						/>
					</svg>
				</button>

				<div className="w-px h-5 bg-slate-700 mx-1" />

				<button
					onClick={deleteSelected}
					className="p-1.5 rounded hover:bg-red-600"
					title={t('delete')}
				>
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
				</button>

				<div className="flex-1" />

				<button
					onClick={handleSave}
					className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1"
				>
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M5 13l4 4L19 7"
						/>
					</svg>
					Salvar Edições
				</button>
			</div>

			<div
				ref={containerRef}
				className="flex-1 p-4 overflow-auto"
				style={{ backgroundColor: '#1e293b' }}
			>
				<canvas ref={canvasRef} />
			</div>

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
