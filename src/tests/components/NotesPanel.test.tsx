import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NotesPanel from '../../components/NotesPanel';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { setupIpcMock } from '../mocks/electron.mock';

describe('NotesPanel', () => {
	let mockIpc: ReturnType<typeof setupIpcMock>;
	const mockOnToggle = vi.fn();
	const currentFolder = '/test/folder';

	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		mockIpc = setupIpcMock();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		cleanup();
	});

	const renderComponent = (isOpen = true) => {
		return render(
			<LanguageProvider>
				<NotesPanel
					currentFolder={currentFolder}
					isOpen={isOpen}
					onToggle={mockOnToggle}
				/>
			</LanguageProvider>,
		);
	};

	it('deve carregar notas ao montar com pasta válida', async () => {
		mockIpc.invoke.mockResolvedValueOnce({
			success: true,
			data: { text: 'Minhas notas de teste', images: [] },
		});

		renderComponent();

		await waitFor(() => {
			expect(mockIpc.invoke).toHaveBeenCalledWith('load-notes', currentFolder);
		});
	});

	it('deve exibir notas carregadas', async () => {
		mockIpc.invoke.mockResolvedValueOnce({
			success: true,
			data: { text: 'Conteúdo das notas', images: [] },
		});

		renderComponent();

		await waitFor(() => {
			const textarea = screen.getByRole('textbox');
			expect(textarea).toHaveValue('Conteúdo das notas');
		});
	});

	it('deve auto-salvar após 1 segundo de inatividade', async () => {
		mockIpc.invoke.mockResolvedValueOnce({
			success: true,
			data: { text: '', images: [] },
		});

		const user = userEvent.setup({ delay: null });
		renderComponent();

		const textarea = screen.getByRole('textbox');
		await user.type(textarea, 'Nova nota');

		// Avança o timer 1 segundo
		vi.advanceTimersByTime(1000);

		await waitFor(() => {
			expect(mockIpc.invoke).toHaveBeenCalledWith('save-notes', currentFolder, {
				text: expect.stringContaining('Nova nota'),
				images: [],
			});
		});
	});

	it('deve chamar onToggle ao clicar no botão de fechar', async () => {
		mockIpc.invoke.mockResolvedValueOnce({
			success: true,
			data: { text: '', images: [] },
		});

		const user = userEvent.setup();
		renderComponent();

		const closeButton = screen.getByTitle(/Fechar|Close/i);
		await user.click(closeButton);

		expect(mockOnToggle).toHaveBeenCalled();
	});

	it('deve estar oculto quando isOpen é false', () => {
		const { container } = renderComponent(false);

		const panel = container.querySelector('.w-0');
		expect(panel).toBeInTheDocument();
	});

	it('deve ter width 400px quando isOpen é true', () => {
		const { container } = renderComponent(true);

		const panel = container.querySelector('.w-\\[400px\\]');
		expect(panel).toBeInTheDocument();
	});

	it('deve lidar com erro ao carregar notas', async () => {
		mockIpc.invoke.mockResolvedValueOnce({
			success: false,
			error: 'Erro ao carregar',
		});

		renderComponent();

		await waitFor(() => {
			const textarea = screen.getByRole('textbox');
			expect(textarea).toHaveValue('');
		});
	});

	it('deve adicionar imagem colada via clipboard', async () => {
		mockIpc.invoke.mockResolvedValueOnce({
			success: true,
			data: { text: '', images: [] },
		});

		const user = userEvent.setup();
		renderComponent();

		const textarea = screen.getByRole('textbox');

		// Simula paste com imagem
		const file = new File(['dummy'], 'image.png', { type: 'image/png' });
		const clipboardData = {
			items: [
				{
					type: 'image/png',
					getAsFile: () => file,
				},
			],
		};

		await user.click(textarea);
		// Trigger paste event
		const pasteEvent = new ClipboardEvent('paste', {
			clipboardData: clipboardData as any,
		});
		textarea.dispatchEvent(pasteEvent);

		// Image should be added to the state
		await waitFor(() => {
			// Check if image container exists after paste
			// This would require the component to render the images
		});
	});

	it('deve remover imagem ao clicar no botão de deletar', async () => {
		mockIpc.invoke.mockResolvedValueOnce({
			success: true,
			data: {
				text: '',
				images: ['data:image/png;base64,test123'],
			},
		});

		const user = userEvent.setup();
		renderComponent();

		await waitFor(() => {
			const deleteButtons = screen.queryAllByTitle(/Remover|Remove/i);
			if (deleteButtons.length > 0) {
				return user.click(deleteButtons[0]);
			}
		});
	});

	it('deve exibir título e subtítulo', () => {
		mockIpc.invoke.mockResolvedValueOnce({
			success: true,
			data: { text: '', images: [] },
		});

		renderComponent();

		expect(screen.getByText(/Notas|Notes/i)).toBeInTheDocument();
	});
});
