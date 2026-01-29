import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FolderManager from '../../components/FolderManager';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { mockElectronResponses, setupIpcMock } from '../mocks/electron.mock';

const renderWithProvider = (component: React.ReactElement) => {
	return render(<LanguageProvider>{component}</LanguageProvider>);
};

const mockHeaderData = {
	testName: 'Teste Exemplo',
	executor: 'Tester',
	system: 'Sistema Web',
	testCycle: 'Sprint 1',
	testCase: 'TC-001',
};

describe('FolderManager Component', () => {
	let mockIpc: ReturnType<typeof setupIpcMock>;

	beforeEach(() => {
		localStorage.clear();
		mockIpc = setupIpcMock();
	});

	describe('Rendering', () => {
		it('deve renderizar botão de selecionar pasta', () => {
			renderWithProvider(
				<FolderManager
					headerData={mockHeaderData}
					currentFolder=""
					onFolderChange={() => {}}
				/>,
			);

			expect(
				screen.getByText(/continuar teste|continue test/i),
			).toBeInTheDocument();
		});

		it('deve renderizar botão de nova pasta', () => {
			renderWithProvider(
				<FolderManager
					headerData={mockHeaderData}
					currentFolder=""
					onFolderChange={() => {}}
				/>,
			);

			expect(screen.getByText(/novo teste|new test/i)).toBeInTheDocument();
		});

		it('não deve mostrar caminho quando não há pasta', () => {
			renderWithProvider(
				<FolderManager
					headerData={mockHeaderData}
					currentFolder=""
					onFolderChange={() => {}}
				/>,
			);

			expect(screen.queryByText(/\//)).not.toBeInTheDocument();
		});

		it('deve mostrar caminho da pasta quando selecionada', () => {
			renderWithProvider(
				<FolderManager
					headerData={mockHeaderData}
					currentFolder="/fake/path/to/folder"
					onFolderChange={() => {}}
				/>,
			);

			expect(screen.getByText(/fake.*folder/i)).toBeInTheDocument();
		});
	});

	describe('Folder Selection', () => {
		it('deve chamar onFolderChange ao selecionar pasta', async () => {
			const user = userEvent.setup();
			const onFolderChange = vi.fn();

			mockIpc.invoke.mockResolvedValueOnce(
				mockElectronResponses.selectFolder('/selected/folder'),
			);

			renderWithProvider(
				<FolderManager
					headerData={mockHeaderData}
					currentFolder=""
					onFolderChange={onFolderChange}
				/>,
			);

			const selectButton = screen.getByText(/continuar teste|continue test/i);
			await user.click(selectButton);

			await waitFor(() => {
				expect(mockIpc.invoke).toHaveBeenCalledWith('select-folder');
				expect(onFolderChange).toHaveBeenCalledWith('/selected/folder');
			});
		});

		it('não deve chamar onFolderChange se seleção for cancelada', async () => {
			const user = userEvent.setup();
			const onFolderChange = vi.fn();

			mockIpc.invoke.mockResolvedValueOnce({ canceled: true, filePaths: [] });

			renderWithProvider(
				<FolderManager
					headerData={mockHeaderData}
					currentFolder=""
					onFolderChange={onFolderChange}
				/>,
			);

			const selectButton = screen.getByText(/continuar teste|continue test/i);
			await user.click(selectButton);

			await waitFor(() => {
				expect(mockIpc.invoke).toHaveBeenCalledWith('select-folder');
				expect(onFolderChange).not.toHaveBeenCalled();
			});
		});
	});

	describe('New Folder Creation', () => {
		it('deve chamar onFolderChange ao criar nova pasta', async () => {
			const user = userEvent.setup();
			const onFolderChange = vi.fn();

			mockIpc.invoke.mockResolvedValueOnce('/new/folder/path');

			renderWithProvider(
				<FolderManager
					headerData={mockHeaderData}
					currentFolder=""
					onFolderChange={onFolderChange}
				/>,
			);

			const newFolderButton = screen.getByText(/novo teste|new test/i);
			await user.click(newFolderButton);

			await waitFor(() => {
				expect(mockIpc.invoke).toHaveBeenCalledWith('create-new-folder');
				expect(onFolderChange).toHaveBeenCalledWith('/new/folder/path', true);
			});
		});

		it('não deve chamar onFolderChange se criação falhar', async () => {
			const user = userEvent.setup();
			const onFolderChange = vi.fn();

			mockIpc.invoke.mockResolvedValueOnce(null);

			renderWithProvider(
				<FolderManager
					headerData={mockHeaderData}
					currentFolder=""
					onFolderChange={onFolderChange}
				/>,
			);

			const newFolderButton = screen.getByText(/novo teste|new test/i);
			await user.click(newFolderButton);

			await waitFor(() => {
				expect(mockIpc.invoke).toHaveBeenCalledWith('create-new-folder');
				expect(onFolderChange).not.toHaveBeenCalled();
			});
		});
	});

	describe('Open Folder in Finder', () => {
		it('deve mostrar botão para abrir pasta quando há pasta selecionada', () => {
			renderWithProvider(
				<FolderManager
					headerData={mockHeaderData}
					currentFolder="/fake/path"
					onFolderChange={() => {}}
				/>,
			);

			const openButton = screen.getByTitle(/abrir.*pasta|open.*folder/i);
			expect(openButton).toBeInTheDocument();
		});

		it('deve chamar IPC para abrir pasta no Finder', async () => {
			const user = userEvent.setup();

			mockIpc.invoke.mockResolvedValueOnce({ success: true });

			renderWithProvider(
				<FolderManager
					headerData={mockHeaderData}
					currentFolder="/fake/path"
					onFolderChange={() => {}}
				/>,
			);

			const openButton = screen.getByTitle(/abrir.*pasta|open.*folder/i);
			await user.click(openButton);

			await waitFor(() => {
				expect(mockIpc.invoke).toHaveBeenCalledWith(
					'open-folder-in-finder',
					'/fake/path',
				);
			});
		});
	});

	describe('Accessibility', () => {
		it('botões devem ter tooltips', () => {
			renderWithProvider(
				<FolderManager
					headerData={mockHeaderData}
					currentFolder="/fake/path"
					onFolderChange={() => {}}
				/>,
			);

			const buttons = screen.getAllByRole('button');
			buttons.forEach((button) => {
				// Botões devem ter title ou aria-label
				const hasTooltip =
					button.hasAttribute('title') || button.hasAttribute('aria-label');
				expect(hasTooltip).toBe(true);
			});
		});

		it('deve ter hover states nos botões', () => {
			renderWithProvider(
				<FolderManager
					headerData={mockHeaderData}
					currentFolder=""
					onFolderChange={() => {}}
				/>,
			);

			const buttons = screen.getAllByRole('button');
			buttons.forEach((button) => {
				expect(button.className).toMatch(/hover:/);
			});
		});
	});

	describe('Styling', () => {
		it('botões devem ter estilos corretos', () => {
			renderWithProvider(
				<FolderManager
					headerData={mockHeaderData}
					currentFolder=""
					onFolderChange={() => {}}
				/>,
			);

			const selectButton = screen.getByText(/continuar teste|continue test/i);
			expect(selectButton).toHaveClass('btn-primary');
		});

		it('deve ter layout flex apropriado', () => {
			const { container } = renderWithProvider(
				<FolderManager
					headerData={mockHeaderData}
					currentFolder="/fake/path"
					onFolderChange={() => {}}
				/>,
			);

			const wrapper = container.firstChild as HTMLElement;
			expect(wrapper?.className).toMatch(/flex/);
		});
	});

	describe('Edge Cases', () => {
		it('deve lidar com IPC error gracefully', async () => {
			const user = userEvent.setup();
			const consoleError = vi
				.spyOn(console, 'error')
				.mockImplementation(() => {});

			mockIpc.invoke.mockRejectedValueOnce(new Error('IPC Error'));

			renderWithProvider(
				<FolderManager
					headerData={mockHeaderData}
					currentFolder=""
					onFolderChange={() => {}}
				/>,
			);

			const selectButton = screen.getByText(/continuar teste|continue test/i);
			await user.click(selectButton);

			// Não deve quebrar a aplicação
			await waitFor(() => {
				expect(mockIpc.invoke).toHaveBeenCalled();
			});

			consoleError.mockRestore();
		});

		it('deve lidar com caminho de pasta muito longo', () => {
			const longPath =
				'/very/long/path/that/goes/on/and/on/and/on/to/test/truncation';

			renderWithProvider(
				<FolderManager
					headerData={mockHeaderData}
					currentFolder={longPath}
					onFolderChange={() => {}}
				/>,
			);

			expect(screen.getByText(/very.*truncation/)).toBeInTheDocument();
		});
	});
});
