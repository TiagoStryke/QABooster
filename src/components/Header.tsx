import { HeaderData } from '../App';

interface HeaderProps {
	headerData: HeaderData;
	setHeaderData: (data: HeaderData) => void;
}

export default function Header({ headerData, setHeaderData }: HeaderProps) {
	const handleChange = (field: keyof HeaderData, value: string) => {
		setHeaderData({ ...headerData, [field]: value });
	};

	return (
		<div
			className="bg-slate-800 border-b border-slate-700 p-3"
			style={{ WebkitAppRegion: 'drag' } as any}
		>
			<h1 className="text-base font-bold text-primary-400 mb-2 ml-20">
				QA Booster - Gerador de evidências de testes
			</h1>

			<div
				className="grid grid-cols-3 gap-2"
				style={{ WebkitAppRegion: 'no-drag' } as any}
			>
				<div>
					<label className="block text-xs font-medium text-slate-300 mb-1">
						Resultado do Teste
					</label>
					<select
						className="input-field w-full text-xs py-1.5"
						value={headerData.testName}
						onChange={(e) => handleChange('testName', e.target.value)}
					>
						<option value="">Selecione...</option>
						<option value="✅ Aprovado">✅ Aprovado</option>
						<option value="❌ Reprovado">❌ Reprovado</option>
						<option value="⚠️ Parcial">⚠️ Parcial</option>
					</select>
				</div>

				<div>
					<label className="block text-xs font-medium text-slate-300 mb-1">
						Sistema
					</label>
					<input
						type="text"
						className="input-field w-full text-xs py-1.5"
						placeholder="Ex: hom-regressivo-b2c.voegol.com.br"
						value={headerData.system}
						onChange={(e) => handleChange('system', e.target.value)}
					/>
				</div>

				<div>
					<label className="block text-xs font-medium text-slate-300 mb-1">
						Ciclo de Teste
					</label>
					<input
						type="text"
						className="input-field w-full text-xs py-1.5"
						placeholder="Ex: TSTGOL-R2960"
						value={headerData.testCycle}
						onChange={(e) => handleChange('testCycle', e.target.value)}
					/>
				</div>

				<div>
					<label className="block text-xs font-medium text-slate-300 mb-1">
						Caso de Teste
					</label>
					<input
						type="text"
						className="input-field w-full text-xs py-1.5"
						placeholder="Ex: TSTGOL-T13231 (1.0)"
						value={headerData.testCase}
						onChange={(e) => handleChange('testCase', e.target.value)}
					/>
				</div>

				<div>
					<label className="block text-xs font-medium text-slate-300 mb-1">
						Executor
					</label>
					<input
						type="text"
						className="input-field w-full text-xs py-1.5"
						placeholder="Seu nome"
						value={headerData.executor}
						onChange={(e) => handleChange('executor', e.target.value)}
					/>
				</div>

				<div>
					<label className="block text-xs font-medium text-slate-300 mb-1">
						Data e Hora da Execução
					</label>
					<input
						type="text"
						className="input-field w-full text-xs py-1.5 bg-slate-700"
						value={new Date().toLocaleString('pt-BR')}
						readOnly
					/>
				</div>
			</div>
		</div>
	);
}
