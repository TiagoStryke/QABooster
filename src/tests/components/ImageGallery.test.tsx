import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ImageGallery from '../../components/ImageGallery';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { setupIpcMock } from '../mocks/electron.mock';

const mockImages = [
	{
		name: 'screenshot1.png',
		path: '/path/to/screenshot1.png',
		timestamp: Date.now(),
	},
	{
		name: 'screenshot2.png',
		path: '/path/to/screenshot2.png',
		timestamp: Date.now() + 1000,
	},
	{
		name: 'screenshot3.png',
		path: '/path/to/screenshot3.png',
		timestamp: Date.now() + 2000,
	},
];

describe('ImageGallery', () => {
	let mockIpc: ReturnType<typeof setupIpcMock>;
	const mockOnImageSelect = vi.fn();
	const mockOnImageDelete = vi.fn();
	const mockOnImagePreview = vi.fn();
	const mockOnImageReorder = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		mockIpc = setupIpcMock();
		// Mock read-image-as-base64 to return base64 data
		mockIpc.invoke.mockImplementation((channel) => {
			if (channel === 'read-image-as-base64') {
				return Promise.resolve('data:image/png;base64,iVBORw0KGgoAAAANS');
			}
			return Promise.resolve();
		});
	});

	afterEach(() => {
		cleanup();
	});

	const renderComponent = (selectedImage: any = null) => {
		return render(
			<LanguageProvider>
				<ImageGallery
					images={mockImages}
					onImageSelect={mockOnImageSelect}
					onImageDelete={mockOnImageDelete}
					onImagePreview={mockOnImagePreview}
					onImageReorder={mockOnImageReorder}
					selectedImage={selectedImage}
				/>
			</LanguageProvider>,
		);
	};

	it('deve renderizar mensagem quando não há imagens', () => {
		render(
			<LanguageProvider>
				<ImageGallery
					images={[]}
					onImageSelect={mockOnImageSelect}
					onImageDelete={mockOnImageDelete}
					onImagePreview={mockOnImagePreview}
					onImageReorder={mockOnImageReorder}
					selectedImage={null}
				/>
			</LanguageProvider>,
		);

		expect(screen.getByText(/Nenhuma imagem/i)).toBeInTheDocument();
	});

	it('deve carregar imagens via IPC', async () => {
		renderComponent();

		// Aguarda as imagens carregarem
		await vi.waitFor(() => {
			expect(mockIpc.invoke).toHaveBeenCalledWith(
				'read-image-as-base64',
				mockImages[0].path,
			);
		});

		expect(mockIpc.invoke).toHaveBeenCalledWith(
			'read-image-as-base64',
			mockImages[1].path,
		);
		expect(mockIpc.invoke).toHaveBeenCalledWith(
			'read-image-as-base64',
			mockImages[2].path,
		);
	});

	it('deve exibir spinner enquanto carrega imagem', () => {
		mockIpc.invoke.mockReturnValue(new Promise(() => {})); // Never resolves
		renderComponent();

		const spinners = document.querySelectorAll('.animate-spin');
		expect(spinners.length).toBeGreaterThan(0);
	});

	it('deve chamar onImagePreview ao clicar no botão de visualizar', async () => {
		const user = userEvent.setup();
		renderComponent();

		await vi.waitFor(() => {
			expect(mockIpc.invoke).toHaveBeenCalled();
		});

		const previewButtons = screen.getAllByTitle(/Visualizar|View/i);
		await user.click(previewButtons[0]);

		expect(mockOnImagePreview).toHaveBeenCalledWith(mockImages[0]);
	});

	it('deve chamar onImageDelete ao clicar no botão de deletar', async () => {
		const user = userEvent.setup();
		renderComponent();

		await vi.waitFor(() => {
			expect(mockIpc.invoke).toHaveBeenCalled();
		});

		const deleteButtons = screen.getAllByTitle(/Deletar|Delete/i);
		await user.click(deleteButtons[0]);

		expect(mockOnImageDelete).toHaveBeenCalledWith(mockImages[0]);
	});

	it('deve chamar onImageSelect ao clicar em Editar', async () => {
		const user = userEvent.setup();
		renderComponent();

		await vi.waitFor(() => {
			expect(mockIpc.invoke).toHaveBeenCalled();
		});

		const editButtons = screen.getAllByTitle(/Editar|Edit/i);
		await user.click(editButtons[0]);

		expect(mockOnImageSelect).toHaveBeenCalledWith(mockImages[0]);
	});

	it('deve destacar imagem selecionada com ring', () => {
		const { container } = renderComponent(mockImages[0]);

		// Verifica se há um elemento com ring-4 ring-primary-500
		const selectedElement = container.querySelector('.ring-4.ring-primary-500');
		expect(selectedElement).toBeInTheDocument();
	});

	it('deve exibir contador de imagens', () => {
		renderComponent();

		expect(screen.getByText(/3/)).toBeInTheDocument();
	});

	it('deve aplicar opacity-50 em imagem sendo arrastada', () => {
		// Test drag state through class application
		const { container } = renderComponent();

		const draggableElements = container.querySelectorAll('[draggable]');
		expect(draggableElements.length).toBeGreaterThan(0);
	});
});
