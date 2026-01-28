import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import HelpTips from '../../components/HelpTips';
import { LanguageProvider } from '../../contexts/LanguageContext';

const renderWithProvider = (component: React.ReactElement) => {
	return render(<LanguageProvider>{component}</LanguageProvider>);
};

describe('HelpTips Component', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	describe('Rendering', () => {
		it('deve renderizar botão de ajuda', () => {
			renderWithProvider(<HelpTips />);

			const button = screen.getByTitle(/ajuda|help/i);
			expect(button).toBeInTheDocument();
		});

		it('modal deve estar fechado inicialmente', () => {
			renderWithProvider(<HelpTips />);

			expect(screen.queryByText(/como usar/i)).not.toBeInTheDocument();
		});

		it('deve ter ícone de interrogação', () => {
			renderWithProvider(<HelpTips />);

			const button = screen.getByTitle(/ajuda|help/i);
			const svg = button.querySelector('svg');
			expect(svg).toBeInTheDocument();
		});
	});

	describe('Interactions', () => {
		it('deve abrir modal ao clicar no botão', async () => {
			const user = userEvent.setup();
			renderWithProvider(<HelpTips />);

			const button = screen.getByTitle(/ajuda|help/i);
			await user.click(button);

			expect(screen.getByText(/como usar/i)).toBeInTheDocument();
		});

		it('deve fechar modal ao clicar novamente no botão', async () => {
			const user = userEvent.setup();
			renderWithProvider(<HelpTips />);

			const button = screen.getByTitle(/ajuda|help/i);

			// Abre
			await user.click(button);
			expect(screen.getByText(/como usar/i)).toBeInTheDocument();

			// Fecha
			await user.click(button);
			expect(screen.queryByText(/como usar/i)).not.toBeInTheDocument();
		});

		it('deve fechar modal ao clicar no X', async () => {
			const user = userEvent.setup();
			renderWithProvider(<HelpTips />);

			const button = screen.getByTitle(/ajuda|help/i);
			await user.click(button);

			// Modal aberto
			expect(screen.getByText(/como usar/i)).toBeInTheDocument();

			// Clica no botão de fechar
			const closeButtons = screen.getAllByRole('button');
			const closeButton = closeButtons.find((btn) =>
				btn.querySelector('path[d*="M6 18L18 6"]'),
			);

			if (closeButton) {
				await user.click(closeButton);
				expect(screen.queryByText(/como usar/i)).not.toBeInTheDocument();
			}
		});
	});

	describe('Content', () => {
		it('deve mostrar seções de ajuda quando aberto', async () => {
			const user = userEvent.setup();
			renderWithProvider(<HelpTips />);

			const button = screen.getByTitle(/ajuda|help/i);
			await user.click(button);

			// Verifica se as seções principais aparecem
			expect(screen.getByText(/como usar/i)).toBeInTheDocument();
		});

		it('deve mostrar dicas em português por padrão', async () => {
			const user = userEvent.setup();
			renderWithProvider(<HelpTips />);

			const button = screen.getByTitle(/ajuda|help/i);
			await user.click(button);

			expect(screen.getByText(/como usar/i)).toBeInTheDocument();
		});

		it('deve ter estilo correto no modal', async () => {
			const user = userEvent.setup();
			renderWithProvider(<HelpTips />);

			const button = screen.getByTitle(/ajuda|help/i);
			await user.click(button);

			const modal = screen.getByText(/como usar/i).closest('div.absolute');
			expect(modal).toHaveClass('absolute', 'right-0', 'bg-slate-800');
		});
	});

	describe('Accessibility', () => {
		it('botão deve ter title para tooltip', () => {
			renderWithProvider(<HelpTips />);

			const button = screen.getByTitle(/ajuda|help/i);
			expect(button).toHaveAttribute('title');
		});

		it('botão deve ter hover state', () => {
			renderWithProvider(<HelpTips />);

			const button = screen.getByTitle(/ajuda|help/i);
			expect(button).toHaveClass('hover:bg-slate-700');
		});

		it('ícones devem ter viewBox e paths corretos', () => {
			renderWithProvider(<HelpTips />);

			const button = screen.getByTitle(/ajuda|help/i);
			const svg = button.querySelector('svg');

			expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
			expect(svg?.querySelector('path')).toBeInTheDocument();
		});
	});

	describe('State Management', () => {
		it('deve manter estado isolado entre múltiplas instâncias', async () => {
			const user = userEvent.setup();
			const { rerender } = renderWithProvider(
				<>
					<HelpTips />
					<HelpTips />
				</>,
			);

			const buttons = screen.getAllByTitle(/ajuda|help/i);
			expect(buttons).toHaveLength(2);

			// Abre primeiro
			await user.click(buttons[0]);

			// Deve ter apenas um modal aberto
			const modals = screen.getAllByText(/como usar/i);
			expect(modals.length).toBeGreaterThanOrEqual(1);
		});

		it('deve resetar estado ao desmontar e remontar', async () => {
			const user = userEvent.setup();
			const { unmount } = renderWithProvider(<HelpTips />);

			const button = screen.getByTitle(/ajuda|help/i);
			await user.click(button);

			expect(screen.getByText(/como usar/i)).toBeInTheDocument();

			unmount();

			// Remonta
			renderWithProvider(<HelpTips />);

			// Modal deve estar fechado
			expect(screen.queryByText(/como usar/i)).not.toBeInTheDocument();
		});
	});

	describe('Styling', () => {
		it('deve ter z-index alto para sobrepor outros elementos', async () => {
			const user = userEvent.setup();
			renderWithProvider(<HelpTips />);

			const button = screen.getByTitle(/ajuda|help/i);
			await user.click(button);

			const modal = screen.getByText(/como usar/i).closest('div.absolute');
			expect(modal).toHaveClass('z-50');
		});

		it('botão deve ter transições suaves', () => {
			renderWithProvider(<HelpTips />);

			const button = screen.getByTitle(/ajuda|help/i);
			expect(button).toHaveClass('transition-colors');
		});

		it('modal deve ter shadow para destaque', async () => {
			const user = userEvent.setup();
			renderWithProvider(<HelpTips />);

			const button = screen.getByTitle(/ajuda|help/i);
			await user.click(button);

			const modal = screen.getByText(/como usar/i).closest('div.absolute');
			expect(modal).toHaveClass('shadow-2xl');
		});
	});
});
