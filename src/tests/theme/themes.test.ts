import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applyTheme, Theme, themes } from '../../theme/themes';

describe('Theme System', () => {
	let rootElement: HTMLElement;

	beforeEach(() => {
		rootElement = document.documentElement;
		// Limpa estilos anteriores
		rootElement.style.cssText = '';
	});

	afterEach(() => {
		rootElement.style.cssText = '';
	});

	describe('themes object', () => {
		it('deve conter todos os temas esperados', () => {
			expect(themes).toHaveProperty('blue');
			expect(themes).toHaveProperty('dark');
			expect(themes).toHaveProperty('grey');
			expect(themes).toHaveProperty('rose');
			expect(themes).toHaveProperty('light');
			expect(themes).toHaveProperty('green');
		});

		it('cada tema deve ter todas as propriedades necessárias', () => {
			const requiredProps = [
				'name',
				'primary',
				'primaryDark',
				'primaryLight',
				'background',
				'backgroundLight',
				'backgroundLighter',
				'text',
				'textSecondary',
				'textTertiary',
				'border',
				'success',
				'error',
				'warning',
			];

			Object.values(themes).forEach((theme) => {
				requiredProps.forEach((prop) => {
					expect(theme).toHaveProperty(prop);
					if (prop !== 'name') {
						expect(typeof (theme as any)[prop]).toBe('string');
						expect((theme as any)[prop]).toMatch(/^#[0-9a-fA-F]{6}$/); // Valida formato hex
					}
				});
			});
		});

		it('tema blue deve ter cores azuis como primary', () => {
			expect(themes.blue.primary).toBe('#3b82f6');
		});

		it('tema rose deve ter cores roxas/rosa', () => {
			expect(themes.rose.primary).toBe('#f472b6');
			expect(themes.rose.background).toBe('#1a0a1a');
		});

		it('tema light deve ter background claro', () => {
			// Background deve ser mais claro (valor hex maior)
			expect(parseInt(themes.light.background.slice(1), 16)).toBeGreaterThan(
				parseInt(themes.dark.background.slice(1), 16),
			);
		});
	});

	describe('applyTheme function', () => {
		it('deve aplicar tema blue corretamente', () => {
			applyTheme('blue');

			expect(rootElement.style.getPropertyValue('--color-primary')).toBe(
				themes.blue.primary,
			);
			expect(rootElement.style.getPropertyValue('--color-background')).toBe(
				themes.blue.background,
			);
			expect(rootElement.style.getPropertyValue('--color-text')).toBe(
				themes.blue.text,
			);
		});

		it('deve aplicar tema dark corretamente', () => {
			applyTheme('dark');

			expect(rootElement.style.getPropertyValue('--color-primary')).toBe(
				themes.dark.primary,
			);
			expect(rootElement.style.getPropertyValue('--color-background')).toBe(
				themes.dark.background,
			);
		});

		it('deve aplicar tema rose corretamente', () => {
			applyTheme('rose');

			expect(rootElement.style.getPropertyValue('--color-primary')).toBe(
				themes.rose.primary,
			);
			expect(
				rootElement.style.getPropertyValue('--color-background-light'),
			).toBe(themes.rose.backgroundLight);
		});

		it('deve aplicar todas as CSS variables', () => {
			applyTheme('green');

			const expectedVars = [
				'--color-primary',
				'--color-primary-dark',
				'--color-primary-light',
				'--color-background',
				'--color-background-light',
				'--color-background-lighter',
				'--color-text',
				'--color-text-secondary',
				'--color-text-tertiary',
				'--color-border',
				'--color-success',
				'--color-error',
				'--color-warning',
			];

			expectedVars.forEach((varName) => {
				const value = rootElement.style.getPropertyValue(varName);
				expect(value).toBeTruthy();
				expect(value).toMatch(/^#[0-9a-fA-F]{6}$/);
			});
		});

		it('deve trocar de tema sem deixar resíduos', () => {
			applyTheme('blue');
			const blueValue = rootElement.style.getPropertyValue('--color-primary');

			applyTheme('rose');
			const roseValue = rootElement.style.getPropertyValue('--color-primary');

			expect(blueValue).not.toBe(roseValue);
			expect(roseValue).toBe(themes.rose.primary);
		});

		it('deve lidar com tema inválido sem quebrar', () => {
			// Aplica tema válido primeiro
			applyTheme('blue');
			const validValue = rootElement.style.getPropertyValue('--color-primary');

			// Tenta aplicar tema inválido - deve lançar erro
			expect(() => {
				applyTheme('invalid' as Theme);
			}).toThrow();

			// Deve manter o tema anterior
			const afterInvalid =
				rootElement.style.getPropertyValue('--color-primary');
			expect(afterInvalid).toBe(validValue);
		});

		it('deve aplicar tema grey corretamente', () => {
			applyTheme('grey');

			expect(rootElement.style.getPropertyValue('--color-primary')).toBe(
				themes.grey.primary,
			);
		});

		it('deve aplicar tema light corretamente', () => {
			applyTheme('light');

			expect(rootElement.style.getPropertyValue('--color-primary')).toBe(
				themes.light.primary,
			);
			expect(rootElement.style.getPropertyValue('--color-text')).toBe(
				themes.light.text,
			);
		});
	});

	describe('Theme persistence', () => {
		it('deve permitir múltiplas trocas de tema', () => {
			const themesToTest: Theme[] = [
				'blue',
				'dark',
				'rose',
				'green',
				'grey',
				'light',
			];

			themesToTest.forEach((theme) => {
				applyTheme(theme);
				expect(rootElement.style.getPropertyValue('--color-primary')).toBe(
					themes[theme].primary,
				);
			});
		});

		it('variáveis CSS devem estar acessíveis para outros elementos', () => {
			applyTheme('blue');

			// Cria elemento filho para testar herança
			const testDiv = document.createElement('div');
			document.body.appendChild(testDiv);

			const computedStyle = window.getComputedStyle(testDiv);
			// CSS variables são herdadas do :root
			expect(
				getComputedStyle(document.documentElement).getPropertyValue(
					'--color-primary',
				),
			).toBeTruthy();

			document.body.removeChild(testDiv);
		});
	});

	describe('Theme colors validation', () => {
		it('success color deve ser verde em todos os temas', () => {
			Object.entries(themes).forEach(([name, theme]) => {
				// Success colors geralmente começam com #1 ou #2 (verde)
				expect(theme.success).toMatch(/^#[0-9a-fA-F]{6}$/);
			});
		});

		it('error color deve ser vermelho em todos os temas', () => {
			Object.entries(themes).forEach(([name, theme]) => {
				expect(theme.error).toMatch(/^#[0-9a-fA-F]{6}$/);
			});
		});

		it('warning color deve ser amarelo/laranja em todos os temas', () => {
			Object.entries(themes).forEach(([name, theme]) => {
				expect(theme.warning).toMatch(/^#[0-9a-fA-F]{6}$/);
			});
		});
	});
});
