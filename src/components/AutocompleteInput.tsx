import { KeyboardEvent, useEffect, useRef, useState } from 'react';

interface AutocompleteInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
	suggestions: string[];
	onRemoveSuggestion: (value: string) => void;
	onBlur?: (value: string) => void; // Salva no histórico quando termina de digitar
}

export default function AutocompleteInput({
	value,
	onChange,
	placeholder,
	className,
	suggestions,
	onRemoveSuggestion,
	onBlur,
}: AutocompleteInputProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const inputRef = useRef<HTMLInputElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Fecha dropdown quando clicar fora
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node) &&
				!inputRef.current?.contains(e.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Reseta highlight quando sugestões mudam
	useEffect(() => {
		setHighlightedIndex(-1);
	}, [suggestions]);

	const handleFocus = () => {
		setIsOpen(true);
	};

	const handleBlur = () => {
		// Delay para permitir clique no X antes de fechar
		setTimeout(() => {
			setIsOpen(false);
			if (onBlur && value.trim().length > 0) {
				onBlur(value);
			}
		}, 200);
	};

	const handleSelect = (suggestion: string) => {
		onChange(suggestion);
		setIsOpen(false);
		inputRef.current?.focus();
	};

	const handleRemove = (e: React.MouseEvent, suggestion: string) => {
		e.stopPropagation(); // Evita selecionar o item ao clicar no X
		onRemoveSuggestion(suggestion);
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (!isOpen || suggestions.length === 0) {
			if (e.key === 'ArrowDown') {
				setIsOpen(true);
			}
			return;
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				setHighlightedIndex((prev) =>
					prev < suggestions.length - 1 ? prev + 1 : 0,
				);
				break;

			case 'ArrowUp':
				e.preventDefault();
				setHighlightedIndex((prev) =>
					prev > 0 ? prev - 1 : suggestions.length - 1,
				);
				break;

			case 'Enter':
				e.preventDefault();
				if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
					handleSelect(suggestions[highlightedIndex]);
				}
				break;

			case 'Escape':
				e.preventDefault();
				setIsOpen(false);
				setHighlightedIndex(-1);
				break;

			case 'Delete':
				// Deleta item highlighted no dropdown
				if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
					e.preventDefault();
					onRemoveSuggestion(suggestions[highlightedIndex]);
				}
				break;
		}
	};

	return (
		<div className="relative">
			<input
				ref={inputRef}
				type="text"
				className={className}
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onFocus={handleFocus}
				onBlur={handleBlur}
				onKeyDown={handleKeyDown}
				autoComplete="off"
			/>

			{/* Dropdown de sugestões */}
			{isOpen && suggestions.length > 0 && (
				<div
					ref={dropdownRef}
					className="absolute z-50 w-full mt-1 bg-slate-700 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
				>
					{suggestions.map((suggestion, index) => (
						<div
							key={suggestion}
							className={`
								flex items-center justify-between px-3 py-2 cursor-pointer
								transition-colors group
								${
									index === highlightedIndex
										? 'bg-primary-600 text-white'
										: 'hover:bg-slate-600 text-slate-200'
								}
							`}
							onClick={() => handleSelect(suggestion)}
							onMouseEnter={() => setHighlightedIndex(index)}
						>
							<span className="flex-1 text-xs truncate">{suggestion}</span>

							{/* Botão de deletar */}
							<button
								className={`
									ml-2 p-0.5 rounded hover:bg-red-600 transition-colors
									${
										index === highlightedIndex
											? 'opacity-100'
											: 'opacity-0 group-hover:opacity-100'
									}
								`}
								onClick={(e) => handleRemove(e, suggestion)}
								title="Remover do histórico"
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
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
