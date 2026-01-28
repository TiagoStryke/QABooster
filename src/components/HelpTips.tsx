import { useState } from 'react';

export default function HelpTips() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="relative">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="p-2 rounded-lg hover:bg-slate-700 transition-colors text-slate-300"
				title="Dicas de Uso"
			>
				<svg
					className="w-5 h-5"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</button>

			{isOpen && (
				<div className="absolute right-0 top-12 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-50 p-3">
					<div className="flex items-center justify-between mb-2">
						<h3 className="text-sm font-semibold text-primary-400 flex items-center gap-1.5">
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M13 10V3L4 14h7v7l9-11h-7z"
								/>
							</svg>
							Como Usar
						</h3>
						<button
							onClick={() => setIsOpen(false)}
							className="text-slate-400 hover:text-white"
						>
							<svg
								className="w-5 h-5"
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

					<div className="space-y-2 text-slate-300">
						<div className="bg-slate-900 p-2 rounded">
							<h4 className="text-xs font-semibold text-primary-300 mb-1">
								📸 Atalhos
							</h4>
							<p className="text-[11px]">
								<strong>Cmd+Shift+S</strong> = Tela cheia
								<br />
								<strong>Cmd+Shift+A</strong> = Área fixa (configure com 📐)
							</p>
						</div>

						<div className="bg-slate-900 p-2 rounded">
							<h4 className="text-xs font-semibold text-primary-300 mb-1">
								✏️ Edição
							</h4>
							<p className="text-[11px]">
								Clique no botão azul nas miniaturas para adicionar setas,
								círculos, texto e desenhos
							</p>
						</div>

						<div className="bg-slate-900 p-2 rounded">
							<h4 className="text-xs font-semibold text-primary-300 mb-1">
								⚡ Workflow
							</h4>
							<p className="text-[11px]">
								1. Crie um novo teste (+ Novo Teste)
								<br />
								2. Preencha o cabeçalho
								<br />
								3. Use os atalhos para capturar evidências
								<br />
								4. Reordene arrastando as miniaturas
								<br />
								5. Gere o PDF final
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
