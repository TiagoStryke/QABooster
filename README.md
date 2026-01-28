# QA Booster - Screenshot Tool

🚀 **Ferramenta profissional de captura e edição de screenshots para QA testers**

Aplicativo Electron desktop para macOS que facilita a vida de QA testers, permitindo capturar, organizar, editar screenshots e gerar relatórios PDF profissionais com evidências de testes.

## ✨ Funcionalidades

### 📸 Captura de Screenshots

- **Atalho global personalizável** (padrão: `Cmd+Shift+S`)
- Captura de tela completa ou área selecionada
- **Suporte a múltiplos monitores**
- Salvamento automático na pasta selecionada
- Funciona em background (minimizado ou maximizado)

### 🖼️ Galeria de Imagens

- Visualização em miniaturas de todos os screenshots
- **Drag-and-drop para reordenar** as imagens
- Numeração automática das evidências
- Exclusão rápida de imagens
- Sincronização em tempo real

### ✏️ Editor de Imagens Integrado

Ferramentas profissionais de anotação:

- **Setas** para indicar elementos
- **Círculos** para destacar áreas
- **Texto** para descrições e comentários
- **Desenho livre** (caneta)
- Seleção de cores personalizadas
- Interface intuitiva estilo Lightshot

### 📄 Geração de PDF Profissional

- **Cabeçalho personalizado** na primeira página com:
  - Resultado do teste (Aprovado/Reprovado/Parcial)
  - Sistema testado
  - Ciclo de teste
  - Caso de teste
  - Nome do executor
  - Data e hora da execução
- Todas as imagens incluídas automaticamente
- Numeração de evidências
- Formatação profissional

### 📁 Gerenciamento de Pastas

- Seleção de pasta de destino
- **Criação automática de pastas** com:
  - Data atual
  - Informações do caso de teste
- Organização facilitada por projeto

## 🎨 Interface

Interface moderna e elegante com:

- Design dark mode profissional
- Cores suaves e agradáveis aos olhos
- Animações e transições suaves
- Layout responsivo e intuitivo
- Ícones vetoriais modernos

## 🛠️ Tecnologias

- **Electron** - Framework desktop cross-platform
- **React 18** - Interface de usuário moderna
- **TypeScript** - Type safety e melhor DX
- **Tailwind CSS** - Estilização elegante e responsiva
- **Fabric.js** - Editor de imagens avançado
- **jsPDF** - Geração de PDFs profissionais
- **React DnD** - Drag-and-drop para reordenação

## 🚀 Como Usar

### Instalação

```bash
# Instalar dependências
npm install

# Iniciar em modo desenvolvimento
npm start

# Compilar para produção
npm run build

# Gerar aplicativo para macOS
npm run package
```

### Primeiro Uso

1. **Configurar informações do teste** no cabeçalho:
   - Selecione o resultado do teste
   - Preencha sistema, ciclo de teste, caso de teste
   - Adicione seu nome como executor

2. **Criar ou selecionar pasta**:
   - Clique em "Nova Pasta" para criar automaticamente (usa data + caso de teste)
   - Ou "Selecionar Pasta" para usar uma existente

3. **Capturar screenshots**:
   - Use o atalho global (Cmd+Shift+S)
   - Os prints são salvos automaticamente
   - Aparecem instantaneamente na galeria

4. **Editar imagens** (opcional):
   - Clique em qualquer imagem na galeria
   - Use as ferramentas de desenho (setas, círculos, texto)
   - Salve as edições

5. **Reordenar evidências**:
   - Arraste e solte as imagens na ordem desejada
   - A numeração é atualizada automaticamente

6. **Gerar PDF**:
   - Clique em "Gerar PDF"
   - O PDF é criado com cabeçalho + todas as imagens
   - Salvo automaticamente na pasta selecionada

### Atalhos de Teclado

- `Cmd+Shift+S` - Capturar screenshot (personalizável)
- Arraste imagens na galeria para reordenar

## 📋 Requisitos

- macOS 10.13 ou superior
- Node.js 18+ e npm

## 🎯 Casos de Uso

Perfeito para:

- QA testers manuais
- Documentação de bugs
- Evidências de testes
- Criação de manuais de reprodução
- Relatórios de testes
- Auditorias de qualidade

## 📝 Estrutura do Projeto

```
QAbooster/
├── electron/          # Processo principal do Electron
│   └── main.ts       # Lógica de captura, shortcuts, IPC
├── src/              # Interface React
│   ├── components/   # Componentes da UI
│   │   ├── Header.tsx
│   │   ├── Toolbar.tsx
│   │   ├── FolderManager.tsx
│   │   ├── ImageGallery.tsx
│   │   └── ImageEditor.tsx
│   ├── App.tsx       # Componente principal
│   ├── main.tsx      # Entry point React
│   └── index.css     # Estilos Tailwind
├── dist/             # Build output
└── package.json      # Dependências e scripts
```

## 🔧 Desenvolvimento

```bash
# Modo desenvolvimento com hot reload
npm start

# Build apenas o renderer (React)
npm run build:renderer

# Build apenas o main process (Electron)
npm run build:main

# Build completo
npm run build
```

## 📦 Distribuição

```bash
# Gerar DMG e ZIP para macOS
npm run package
```

Os arquivos estarão em `release/`.

## 🤝 Contribuindo

Melhorias são sempre bem-vindas! Algumas ideias:

- [ ] Captura de área selecionada (atualmente apenas tela completa)
- [ ] Mais ferramentas de edição (retângulos, linhas, blur)
- [ ] Templates de cabeçalho personalizáveis
- [ ] Export para outros formatos (Word, HTML)
- [ ] Integração com ferramentas de bug tracking
- [ ] Versão para Windows/Linux

## 📄 Licença

MIT

## 👤 Autor

Criado com ❤️ para facilitar a vida dos QA testers

---

**Dica**: Mantenha o app aberto em um segundo monitor enquanto testa no monitor principal para máxima produtividade!
