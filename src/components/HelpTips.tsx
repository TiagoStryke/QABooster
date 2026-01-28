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
								� Início Rápido
							</h4>
							<p className="text-[11px]">
								<strong>1.</strong> Clique em "+ Novo Teste" e escolha onde
								salvar
								<br />
								<strong>2.</strong> Preencha o cabeçalho do teste
								<br />
								<strong>3.</strong> A pasta é renomeada automaticamente com a
								data e caso de teste
							</p>
						</div>

						<div className="bg-slate-900 p-2 rounded">
							<h4 className="text-xs font-semibold text-primary-300 mb-1">
								📸 Captura de Screenshots
							</h4>
							<p className="text-[11px]">
								<strong>Atalhos:</strong> Configure acima (Tela Cheia e Área)
								<br />
								<strong>Área fixa:</strong> Use o botão 📐 para definir área
								reutilizável
								<br />
								<strong>Monitor:</strong> Selecione qual tela capturar (se tiver
								múltiplos)
							</p>
						</div>

						<div className="bg-slate-900 p-2 rounded">
							<h4 className="text-xs font-semibold text-primary-300 mb-1">
								✏️ Edição de Imagens
							</h4>
							<p className="text-[11px]">
								Clique no <strong>botão azul</strong> da miniatura para editar
								<br />
								<strong>Ferramentas:</strong> Setas, círculos, retângulos, texto
								livre e desenho
								<br />
								<strong>Reordenar:</strong> Arraste miniaturas para mudar ordem
							</p>
						</div>

						<div className="bg-slate-900 p-2 rounded">
							<h4 className="text-xs font-semibold text-primary-300 mb-1">
								📄 Gerar PDF
							</h4>
							<p className="text-[11px]">
								<strong>Automático:</strong> Inclui cabeçalho, todas as imagens
								e dados
								<br />
								<strong>Salvamento:</strong> PDF gerado na mesma pasta do teste
								<br />
								<strong>Continuar:</strong> Use "Continuar Teste" para abrir
								pasta existente
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
