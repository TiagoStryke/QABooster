import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from 'react';
import { Language, translations } from '../i18n/translations';

interface LanguageContextType {
	language: Language;
	setLanguage: (lang: Language) => void;
	t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
	undefined,
);

export const useLanguage = () => {
	const context = useContext(LanguageContext);
	if (!context) {
		throw new Error('useLanguage must be used within a LanguageProvider');
	}
	return context;
};

interface LanguageProviderProps {
	children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
	const [language, setLanguageState] = useState<Language>(() => {
		return (localStorage.getItem('qabooster-language') as Language) || 'pt';
	});

	useEffect(() => {
		const handleLanguageChange = (e: CustomEvent) => {
			setLanguageState(e.detail);
		};

		window.addEventListener(
			'language-changed',
			handleLanguageChange as EventListener,
		);

		return () => {
			window.removeEventListener(
				'language-changed',
				handleLanguageChange as EventListener,
			);
		};
	}, []);

	const setLanguage = (lang: Language) => {
		setLanguageState(lang);
		localStorage.setItem('qabooster-language', lang);
		window.dispatchEvent(new CustomEvent('language-changed', { detail: lang }));
	};

	const t = (key: string): string => {
		const keys = key.split('.');
		let value: any = translations[language];

		for (const k of keys) {
			if (value && typeof value === 'object' && k in value) {
				value = value[k];
			} else {
				return key; // Retorna a chave se não encontrar tradução
			}
		}

		return typeof value === 'string' ? value : key;
	};

	return (
		<LanguageContext.Provider value={{ language, setLanguage, t }}>
			{children}
		</LanguageContext.Provider>
	);
};
