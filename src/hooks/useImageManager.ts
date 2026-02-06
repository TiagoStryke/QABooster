import { useState } from 'react';
import { ImageData } from '../interfaces';
import { ipcService } from '../services/ipc-service';

interface UseImageManagerParams {
	loadImages?: () => Promise<void>;
}

interface UseImageManagerReturn {
	images: ImageData[];
	setImages: (images: ImageData[]) => void;
	selectedImage: ImageData | null;
	showEditor: boolean;
	handleImageSelect: (image: ImageData) => void;
	handleImageDelete: (
		image: ImageData,
		confirmMessage: string,
	) => Promise<void>;
	handleImageReorder: (newOrder: ImageData[]) => void;
	handleImagePreview: (image: ImageData) => Promise<void>;
	handleCloseEditor: () => void;
	handleSaveEdited: (dataUrl: string) => Promise<void>;
	resetImages: () => void;
}

/**
 * Manages image state and operations (select, delete, reorder, preview, edit)
 * Handles image gallery interactions and editor state
 */
export function useImageManager({
	loadImages,
}: UseImageManagerParams): UseImageManagerReturn {
	const [images, setImages] = useState<ImageData[]>([]);
	const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
	const [showEditor, setShowEditor] = useState(false);

	const handleImageSelect = (image: ImageData) => {
		setSelectedImage(image);
		setShowEditor(true);
	};

	const handleImageDelete = async (
		image: ImageData,
		confirmMessage: string,
	) => {
		if (confirm(`${confirmMessage} ${image.name}?`)) {
			await ipcService.deleteImage(image.path);
			if (loadImages) await loadImages();
			if (selectedImage?.path === image.path) {
				setSelectedImage(null);
				setShowEditor(false);
			}
		}
	};

	const handleImageReorder = (newOrder: ImageData[]) => {
		setImages(newOrder);
	};

	const handleImagePreview = async (image: ImageData) => {
		await ipcService.openImagePreview(image.path);
	};

	const handleCloseEditor = () => {
		setShowEditor(false);
		setSelectedImage(null);
	};

	const handleSaveEdited = async (dataUrl: string) => {
		if (selectedImage) {
			await ipcService.saveImage({
				dataURL: dataUrl,
				originalPath: selectedImage.path,
				folder: '', // folder will be extracted from path in backend
			});

			// Force thumbnail refresh by updating timestamp
			setImages((prevImages) =>
				prevImages.map((img) =>
					img.path === selectedImage.path
						? { ...img, timestamp: Date.now() }
						: img,
				),
			);

			if (loadImages) await loadImages();
		}
	};

	const resetImages = () => {
		setImages([]);
		setSelectedImage(null);
		setShowEditor(false);
	};

	return {
		images,
		setImages,
		selectedImage,
		showEditor,
		handleImageSelect,
		handleImageDelete,
		handleImageReorder,
		handleImagePreview,
		handleCloseEditor,
		handleSaveEdited,
		resetImages,
	};
}
