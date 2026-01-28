/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: 'var(--color-primary)',
					dark: 'var(--color-primary-dark)',
					light: 'var(--color-primary-light)',
					50: '#f0f9ff',
					100: '#e0f2fe',
					200: '#bae6fd',
					300: '#7dd3fc',
					400: '#38bdf8',
					500: 'var(--color-primary)',
					600: 'var(--color-primary-dark)',
					700: 'var(--color-primary-dark)',
					800: '#075985',
					900: '#0c4a6e',
				},
				background: {
					DEFAULT: 'var(--color-background)',
					light: 'var(--color-background-light)',
					lighter: 'var(--color-background-lighter)',
				},
				text: {
					DEFAULT: 'var(--color-text)',
					secondary: 'var(--color-text-secondary)',
					tertiary: 'var(--color-text-tertiary)',
				},
				border: {
					DEFAULT: 'var(--color-border)',
				},
			},
			borderColor: {
				DEFAULT: 'var(--color-border)',
			},
			backgroundColor: {
				DEFAULT: 'var(--color-background)',
			},
			textColor: {
				DEFAULT: 'var(--color-text)',
			},
			keyframes: {
				'slide-in-right': {
					'0%': { transform: 'translateX(100%)' },
					'100%': { transform: 'translateX(0)' },
				},
			},
			animation: {
				'slide-in-right': 'slide-in-right 0.3s ease-out',
			},
		},
	},
	plugins: [],
};
