import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockFabricCanvas, mockFabric } from '../mocks/fabric.mock';

// Mock fabric globally ANTES dos imports de componentes
vi.mock('fabric', () => ({
	fabric: mockFabric,
}));

import ImageEditor from '../../components/ImageEditor';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { setupIpcMock } from '../mocks/electron.mock';

const mockImage = {
	name: 'test.png',
	path: '/path/to/test.png',
	timestamp: Date.now(),
};

describe('ImageEditor', () => {
	let mockIpc: ReturnType<typeof setupIpcMock>;
	const mockOnClose = vi.fn();
	const mockOnSave = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		mockIpc = setupIpcMock();

		// Mock read-image-as-base64
		mockIpc.invoke.mockImplementation((channel) => {
			if (channel === 'read-image-as-base64') {
				return Promise.resolve('data:image/png;base64,test123');
			}
			return Promise.resolve();
		});

		// Reset fabric mock
		mockFabric.Canvas = vi.fn(() => createMockFabricCanvas());
	});

	afterEach(() => {
		cleanup();
	});

	const renderComponent = () => {
		return render(
			<LanguageProvider>
				<ImageEditor
					image={mockImage}
					onClose={mockOnClose}
					onSave={mockOnSave}
				/>
			</LanguageProvider>,
		);
	};

	it('deve renderizar canvas', () => {
		renderComponent();
		const canvas = document.querySelector('canvas');
		expect(canvas).toBeInTheDocument();
	});

	it('deve carregar imagem via IPC', async () => {
		renderComponent();

		await waitFor(() => {
			expect(mockIpc.invoke).toHaveBeenCalledWith(
				'read-image-as-base64',
				mockImage.path,
			);
		});
	});

	it('deve criar Fabric canvas ao montar', () => {
		renderComponent();
		expect(mockFabric.Canvas).toHaveBeenCalled();
	});

	it('deve renderizar ferramentas de desenho', () => {
		renderComponent();

		// Verifica se botões de ferramentas existem
		expect(screen.getByTitle(/Selecionar|Select/i)).toBeInTheDocument();
		expect(screen.getByTitle(/Seta|Arrow/i)).toBeInTheDocument();
		expect(screen.getByTitle(/Linha|Line/i)).toBeInTheDocument();
		expect(screen.getByTitle(/Retângulo|Rectangle/i)).toBeInTheDocument();
		expect(screen.getByTitle(/Círculo|Circle/i)).toBeInTheDocument();
		expect(screen.getByTitle(/Texto|Text/i)).toBeInTheDocument();
	});

	it('deve trocar ferramenta ao clicar', async () => {
		const user = userEvent.setup();
		renderComponent();

		const arrowButton = screen.getByTitle(/Seta|Arrow/i);
		await user.click(arrowButton);

		// Verifica se botão está selecionado (tem classe de destaque)
		expect(arrowButton).toHaveClass('bg-primary-600');
	});

	it('deve renderizar controles de zoom', () => {
		renderComponent();

		expect(screen.getByTitle(/Ampliar|Zoom In/i)).toBeInTheDocument();
		expect(screen.getByTitle(/Reduzir|Zoom Out/i)).toBeInTheDocument();
		expect(screen.getByTitle(/Resetar|Reset/i)).toBeInTheDocument();
	});

	it('deve aumentar zoom ao clicar em zoom in', async () => {
		const user = userEvent.setup();
		const mockCanvas = createMockFabricCanvas();
		mockFabric.Canvas = vi.fn(() => mockCanvas);

		renderComponent();

		const zoomInButton = screen.getByTitle(/Ampliar|Zoom In/i);
		await user.click(zoomInButton);

		expect(mockCanvas.setZoom).toHaveBeenCalled();
	});

	it('deve diminuir zoom ao clicar em zoom out', async () => {
		const user = userEvent.setup();
		const mockCanvas = createMockFabricCanvas();
		mockFabric.Canvas = vi.fn(() => mockCanvas);

		renderComponent();

		const zoomOutButton = screen.getByTitle(/Reduzir|Zoom Out/i);
		await user.click(zoomOutButton);

		expect(mockCanvas.setZoom).toHaveBeenCalled();
	});

	it('deve resetar zoom ao clicar em reset', async () => {
		const user = userEvent.setup();
		const mockCanvas = createMockFabricCanvas();
		mockFabric.Canvas = vi.fn(() => mockCanvas);

		renderComponent();

		const resetButton = screen.getByTitle(/Resetar|Reset/i);
		await user.click(resetButton);

		expect(mockCanvas.setZoom).toHaveBeenCalled();
	});

	it('deve exibir seletor de cor', () => {
		renderComponent();

		const colorInput = screen.getByDisplayValue('#FF0000');
		expect(colorInput).toBeInTheDocument();
		expect(colorInput).toHaveAttribute('type', 'color');
	});

	it('deve trocar cor ao selecionar', async () => {
		const user = userEvent.setup();
		renderComponent();

		const colorInput = screen.getByDisplayValue('#FF0000') as HTMLInputElement;
		await user.clear(colorInput);
		await user.type(colorInput, '#00FF00');

		expect(colorInput).toHaveValue('#00FF00');
	});

	it('deve chamar onClose ao clicar em fechar', async () => {
		const user = userEvent.setup();
		renderComponent();

		const closeButton = screen.getByTitle(/Fechar|Close/i);
		await user.click(closeButton);

		expect(mockOnClose).toHaveBeenCalled();
	});

	it('deve chamar onSave ao clicar em salvar', async () => {
		const user = userEvent.setup();
		const mockCanvas = createMockFabricCanvas();
		mockFabric.Canvas = vi.fn(() => mockCanvas);

		renderComponent();

		const saveButton = screen.getByTitle(/Salvar|Save/i);
		await user.click(saveButton);

		await waitFor(() => {
			expect(mockCanvas.toDataURL).toHaveBeenCalled();
			expect(mockOnSave).toHaveBeenCalledWith(expect.any(String));
		});
	});

	it('deve limpar canvas ao clicar em limpar', async () => {
		const user = userEvent.setup();
		const mockCanvas = createMockFabricCanvas();
		mockFabric.Canvas = vi.fn(() => mockCanvas);

		renderComponent();

		const clearButton = screen.getByTitle(/Limpar|Clear/i);
		await user.click(clearButton);

		expect(mockCanvas.remove).toHaveBeenCalled();
	});

	it('deve desfazer última ação', async () => {
		const user = userEvent.setup();
		const mockCanvas = createMockFabricCanvas();
		mockFabric.Canvas = vi.fn(() => mockCanvas);

		renderComponent();

		// First add something (simulated by drawing)
		// Then undo
		const undoButton = screen.getByTitle(/Desfazer|Undo/i);
		await user.click(undoButton);

		expect(mockCanvas.remove).toHaveBeenCalled();
	});

	it('deve adicionar seta ao canvas', async () => {
		const user = userEvent.setup();
		const mockCanvas = createMockFabricCanvas();
		mockFabric.Canvas = vi.fn(() => mockCanvas);

		renderComponent();

		const arrowButton = screen.getByTitle(/Seta|Arrow/i);
		await user.click(arrowButton);

		// Simula clique no canvas para adicionar seta
		const canvas = document.querySelector('canvas');
		if (canvas) {
			const clickEvent = new MouseEvent('mousedown', {
				bubbles: true,
				clientX: 100,
				clientY: 100,
			});
			canvas.dispatchEvent(clickEvent);
		}

		// Arrow should be added to canvas
		await waitFor(() => {
			expect(mockCanvas.add).toHaveBeenCalled();
		});
	});

	it('deve adicionar texto ao canvas', async () => {
		const user = userEvent.setup();
		const mockCanvas = createMockFabricCanvas();
		mockFabric.Canvas = vi.fn(() => mockCanvas);

		renderComponent();

		const textButton = screen.getByTitle(/Texto|Text/i);
		await user.click(textButton);

		// Simula clique no canvas
		const canvas = document.querySelector('canvas');
		if (canvas) {
			const clickEvent = new MouseEvent('mousedown', {
				bubbles: true,
				clientX: 100,
				clientY: 100,
			});
			canvas.dispatchEvent(clickEvent);
		}

		await waitFor(() => {
			expect(mockCanvas.add).toHaveBeenCalled();
		});
	});

	it('deve adicionar círculo ao canvas', async () => {
		const user = userEvent.setup();
		const mockCanvas = createMockFabricCanvas();
		mockFabric.Canvas = vi.fn(() => mockCanvas);

		renderComponent();

		const circleButton = screen.getByTitle(/Círculo|Circle/i);
		await user.click(circleButton);

		// Simula arrastar no canvas
		const canvas = document.querySelector('canvas');
		if (canvas) {
			const downEvent = new MouseEvent('mousedown', {
				bubbles: true,
				clientX: 100,
				clientY: 100,
			});
			const upEvent = new MouseEvent('mouseup', {
				bubbles: true,
				clientX: 200,
				clientY: 200,
			});
			canvas.dispatchEvent(downEvent);
			canvas.dispatchEvent(upEvent);
		}

		await waitFor(() => {
			expect(mockCanvas.add).toHaveBeenCalled();
		});
	});

	it('deve adicionar retângulo ao canvas', async () => {
		const user = userEvent.setup();
		const mockCanvas = createMockFabricCanvas();
		mockFabric.Canvas = vi.fn(() => mockCanvas);

		renderComponent();

		const rectButton = screen.getByTitle(/Retângulo|Rectangle/i);
		await user.click(rectButton);

		// Simula arrastar no canvas
		const canvas = document.querySelector('canvas');
		if (canvas) {
			const downEvent = new MouseEvent('mousedown', {
				bubbles: true,
				clientX: 100,
				clientY: 100,
			});
			const upEvent = new MouseEvent('mouseup', {
				bubbles: true,
				clientX: 250,
				clientY: 200,
			});
			canvas.dispatchEvent(downEvent);
			canvas.dispatchEvent(upEvent);
		}

		await waitFor(() => {
			expect(mockCanvas.add).toHaveBeenCalled();
		});
	});

	it('deve ativar modo de desenho livre com pen', async () => {
		const user = userEvent.setup();
		const mockCanvas = createMockFabricCanvas();
		mockFabric.Canvas = vi.fn(() => mockCanvas);

		renderComponent();

		const penButton = screen.getByTitle(/Caneta|Pen/i);
		await user.click(penButton);

		expect(mockCanvas.isDrawingMode).toBe(true);
	});

	it('deve limpar canvas ao desmontar', () => {
		const mockCanvas = createMockFabricCanvas();
		mockFabric.Canvas = vi.fn(() => mockCanvas);

		const { unmount } = renderComponent();
		unmount();

		expect(mockCanvas.dispose).toHaveBeenCalled();
	});

	it('deve exibir porcentagem de zoom', () => {
		renderComponent();

		expect(screen.getByText(/100%/)).toBeInTheDocument();
	});

	it('deve permitir trocar espessura da linha', async () => {
		const user = userEvent.setup();
		renderComponent();

		// Find stroke width control
		const strokeInputs = screen.getAllByRole('spinbutton');
		if (strokeInputs.length > 0) {
			await user.clear(strokeInputs[0]);
			await user.type(strokeInputs[0], '5');

			expect(strokeInputs[0]).toHaveValue(5);
		}
	});
});
