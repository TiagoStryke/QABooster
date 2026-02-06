/**
 * EditorToolbar Component
 *
 * Toolbar com todas as ferramentas do editor:
 * - Ferramentas de desenho (select, arrow, line, rectangle, circle, text, pen)
 * - Stickers
 * - Seletor de cor
 * - Controles de zoom
 * - Botão delete
 * - Botão salvar
 */

import { useLanguage } from '../contexts/LanguageContext';
import type { Tool } from '../hooks/useEditorState';

interface EditorToolbarProps {
	currentTool: Tool;
	onToolChange: (tool: Tool) => void;
	color: string;
	onColorChange: (color: string) => void;
	zoom: number;
	onZoomIn: () => void;
	onZoomOut: () => void;
	onZoomReset: () => void;
	onDelete: () => void;
	onSave: () => void;
	onClose: () => void;
}

export default function EditorToolbar({
	currentTool,
	onToolChange,
	color,
	onColorChange,
	zoom,
	onZoomIn,
	onZoomOut,
	onZoomReset,
	onDelete,
	onSave,
	onClose,
}: EditorToolbarProps) {
	const { t } = useLanguage();

	const isToolActive = (tool: Tool) => currentTool === tool;

	return (
		<div className="bg-slate-800 border-b border-slate-700 p-2 flex items-center gap-1">
			{/* Close button */}
			<button
				onClick={onClose}
				className="p-1.5 rounded hover:bg-slate-700 mr-2"
				title={t('close')}
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
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>

			<div className="w-px h-5 bg-slate-700 mx-1" />

			{/* Select tool */}
			<button
				onClick={() => onToolChange('select')}
				className={`p-1.5 rounded hover:bg-slate-700 ${isToolActive('select') ? 'bg-blue-600' : ''}`}
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
						d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
					/>
				</svg>
			</button>

			<div className="w-px h-5 bg-slate-700 mx-1" />

			{/* Arrow tool */}
			<button
				onClick={() => onToolChange('arrow')}
				className={`p-1.5 rounded hover:bg-slate-700 ${isToolActive('arrow') ? 'bg-blue-600' : ''}`}
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
						d="M14 5l7 7m0 0l-7 7m7-7H3"
					/>
				</svg>
			</button>

			{/* Line tool */}
			<button
				onClick={() => onToolChange('line')}
				className={`p-1.5 rounded hover:bg-slate-700 ${isToolActive('line') ? 'bg-blue-600' : ''}`}
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

			{/* Rectangle tool */}
			<button
				onClick={() => onToolChange('rectangle')}
				className={`p-1.5 rounded hover:bg-slate-700 ${isToolActive('rectangle') ? 'bg-blue-600' : ''}`}
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

			{/* Circle tool */}
			<button
				onClick={() => onToolChange('circle')}
				className={`p-1.5 rounded hover:bg-slate-700 ${isToolActive('circle') ? 'bg-blue-600' : ''}`}
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

			{/* Text tool */}
			<button
				onClick={() => onToolChange('text')}
				className={`p-1.5 rounded hover:bg-slate-700 ${isToolActive('text') ? 'bg-blue-600' : ''}`}
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

			{/* Pen tool */}
			<button
				onClick={() => onToolChange('pen')}
				className={`p-1.5 rounded hover:bg-slate-700 ${isToolActive('pen') ? 'bg-blue-600' : ''}`}
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
				onClick={() => onToolChange('sticker-click')}
				className={`p-1.5 rounded hover:bg-slate-700 ${isToolActive('sticker-click') ? 'bg-blue-600' : ''}`}
				title={t('stickerClick')}
			>
				<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 448 512">
					<path d="M128 40c0-22.1 17.9-40 40-40s40 17.9 40 40V188.2c8.5-7.6 19.7-12.2 32-12.2c20.6 0 38.2 13 45 31.2c8.8-9.3 21.2-15.2 35-15.2c25.3 0 46 19.5 47.9 44.3c8.5-7.7 19.8-12.3 32.1-12.3c26.5 0 48 21.5 48 48v48 16 48c0 70.7-57.3 128-128 128l-16 0H240l-.1 0h-5.2c-5 0-9.9-.3-14.7-1c-55.3-5.6-106.2-34-140-79L8 336c-13.3-17.7-9.7-42.7 8-56s42.7-9.7 56 8l56 74.7V40zM240 304c0-8.8-7.2-16-16-16s-16 7.2-16 16v96c0 8.8 7.2 16 16 16s16-7.2 16-16V304zm48-16c-8.8 0-16 7.2-16 16v96c0 8.8 7.2 16 16 16s16-7.2 16-16V304c0-8.8-7.2-16-16-16zm80 16c0-8.8-7.2-16-16-16s-16 7.2-16 16v96c0 8.8 7.2 16 16 16s16-7.2 16-16V304z" />
				</svg>
			</button>

			<button
				onClick={() => onToolChange('sticker-thumbsdown')}
				className={`p-1.5 rounded hover:bg-slate-700 ${isToolActive('sticker-thumbsdown') ? 'bg-blue-600' : ''}`}
				title={t('stickerThumbsDown')}
			>
				<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
					<path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
				</svg>
			</button>

			<div className="w-px h-5 bg-slate-700 mx-1" />

			{/* Color picker */}
			<label className="text-xs text-slate-300 mr-1">{t('color')}:</label>
			<input
				type="color"
				value={color}
				onChange={(e) => onColorChange(e.target.value)}
				className="w-7 h-7 rounded cursor-pointer border border-slate-600"
			/>

			<div className="w-px h-5 bg-slate-700 mx-1" />

			{/* Zoom controls */}
			<button
				onClick={onZoomOut}
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
				onClick={onZoomIn}
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
				onClick={onZoomReset}
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

			{/* Delete button */}
			<button
				onClick={onDelete}
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

			{/* Save button */}
			<button
				onClick={onSave}
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
				{t('saveEdits')}
			</button>
		</div>
	);
}
