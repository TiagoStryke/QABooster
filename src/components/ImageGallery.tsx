import { useEffect, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ImageData } from '../App';
import { useLanguage } from '../contexts/LanguageContext';

const { ipcRenderer } = window.require('electron');

interface ImageGalleryProps {
	images: ImageData[];
	onImageSelect: (image: ImageData) => void;
	onImageDelete: (image: ImageData) => void;
	onImagePreview: (image: ImageData) => void;
	onImageReorder: (images: ImageData[]) => void;
	selectedImage: ImageData | null;
}

const ItemType = 'IMAGE';

interface DraggableImageProps {
	image: ImageData;
	index: number;
	moveImage: (dragIndex: number, hoverIndex: number) => void;
	onSelect: () => void;
	onDelete: () => void;
	onPreview: () => void;
	isSelected: boolean;
}

function DraggableImage({
	image,
	index,
	moveImage,
	onSelect,
	onDelete,
	onPreview,
	isSelected,
}: DraggableImageProps) {
	const { t } = useLanguage();
	const [imageData, setImageData] = useState<string>('');

	useEffect(() => {
		const loadImage = async () => {
			const base64 = await ipcRenderer.invoke(
				'read-image-as-base64',
				image.path,
			);
			if (base64) setImageData(base64);
		};
		loadImage();
	}, [image.path, image.timestamp]);

	const [{ isDragging }, drag] = useDrag({
		type: ItemType,
		item: { index },
		collect: (monitor) => ({
			isDragging: monitor.isDragging(),
		}),
	});

	const [, drop] = useDrop({
		accept: ItemType,
		hover: (item: { index: number }) => {
			if (item.index !== index) {
				moveImage(item.index, index);
				item.index = index;
			}
		},
	});

	return (
		<div
			ref={(node) => drag(drop(node))}
			className={`relative group cursor-move transition-all duration-200 ${
				isDragging ? 'opacity-50' : 'opacity-100'
			} ${isSelected ? 'ring-4 ring-primary-500' : ''}`}
		>
			<div className="aspect-video bg-slate-700 rounded-lg overflow-hidden relative">
				{imageData ? (
					<img
						src={imageData}
						alt={image.name}
						className="w-full h-full object-cover"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center">
						<div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
					</div>
				)}

				{/* Botões sempre visíveis no topo */}
				<div className="absolute top-1 right-1 flex gap-1">
					<button
						onClick={(e) => {
							e.stopPropagation();
							onPreview();
						}}
						className="bg-green-600 hover:bg-green-700 p-1 rounded transition-colors shadow-lg"
						title={t('view')}
					>
						<svg
							className="w-3 h-3"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
							/>
						</svg>
					</button>
					<button
						onClick={(e) => {
							e.stopPropagation();
							onSelect();
						}}
						className="bg-blue-600 hover:bg-blue-700 p-1 rounded transition-colors shadow-lg"
						title={t('edit')}
					>
						<svg
							className="w-3 h-3"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							/>
						</svg>
					</button>
					<button
						onClick={(e) => {
							e.stopPropagation();
							onDelete();
						}}
						className="bg-red-600 hover:bg-red-700 p-1 rounded transition-colors shadow-lg"
						title={t('deleteImage')}
					>
						<svg
							className="w-3 h-3"
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
				</div>
			</div>

			<p className="text-xs text-slate-400 mt-2 truncate">{image.name}</p>
			<div className="absolute top-1 left-1 bg-slate-900 bg-opacity-90 text-white text-xs px-2 py-1 rounded shadow-lg font-semibold">
				#{index + 1}
			</div>
		</div>
	);
}

export default function ImageGallery({
	images,
	onImageSelect,
	onImageDelete,
	onImagePreview,
	onImageReorder,
	selectedImage,
}: ImageGalleryProps) {
	const { t } = useLanguage();

	const moveImage = (dragIndex: number, hoverIndex: number) => {
		const draggedImage = images[dragIndex];
		const newImages = [...images];
		newImages.splice(dragIndex, 1);
		newImages.splice(hoverIndex, 0, draggedImage);
		onImageReorder(newImages);
	};

	return (
		<DndProvider backend={HTML5Backend}>
			<div className="w-80 bg-slate-800 border-r border-slate-700 overflow-y-auto p-4">
				<h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
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
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
					{t('imageGallery')}
				</h2>

				{images.length === 0 ? (
					<div className="text-center text-slate-400 py-12">
						<svg
							className="w-16 h-16 mx-auto mb-4 opacity-50"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
						<p>{t('noImagesYet')}</p>
						<p className="text-sm mt-2">{t('useShortcut')}</p>
					</div>
				) : (
					<div className="space-y-4">
						{images.map((image, index) => (
							<DraggableImage
								key={image.path}
								image={image}
								index={index}
								moveImage={moveImage}
								onSelect={() => onImageSelect(image)}
								onDelete={() => onImageDelete(image)}
								onPreview={() => onImagePreview(image)}
								isSelected={selectedImage?.path === image.path}
							/>
						))}
					</div>
				)}
			</div>
		</DndProvider>
	);
}
