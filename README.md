# 🏠 AuriaPlan

Uma ferramenta profissional de design de interiores com visualização 2D/3D, biblioteca completa de móveis e colaboração em tempo real.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-18-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg)
![Three.js](https://img.shields.io/badge/Three.js-r160-000000.svg)

## ✨ Funcionalidades

### 🎨 Editor 2D/3D
- **Editor de Plantas Baixas**: Crie plantas baixas profissionais em 2D
- **Visualização 3D**: Renderização em tempo real com Three.js
- **Ferramentas de Desenho**: Paredes, cômodos, portas e janelas
- **Sistema de Snap**: Precisão CAD com snap inteligente
- **Undo/Redo**: Histórico completo de ações

### 🛋️ Biblioteca de Móveis
- **8000+ Itens**: Catálogo completo de móveis e decoração
- **Categorias**: Sala, quarto, cozinha, banheiro, iluminação, decoração
- **Materiais**: Madeiras, metais, tecidos, couros, vidros
- **Cores Personalizáveis**: Paleta extensa de cores

### 🤖 Design com IA
- **Geração Automática**: Deixe a IA criar designs para seus cômodos
- **Estilos**: Moderno, clássico, minimalista, industrial, escandinavo
- **Sugestões Inteligentes**: Baseadas no tipo de cômodo e preferências

### 👥 Colaboração
- **Tempo Real**: Edição simultânea com múltiplos usuários
- **Cursores ao Vivo**: Veja onde outros usuários estão trabalhando
- **Chat Integrado**: Comunicação dentro do projeto
- **Permissões**: Controle de acesso (proprietário, editor, visualizador)

### 📤 Exportação
- **Formatos**: JSON, OBJ, SVG, PNG, PDF
- **Qualidade**: Exportação em alta resolução
- **Compartilhamento**: Links compartilháveis com expiração

## 🚀 Tecnologias

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Three.js + React Three Fiber** - 3D rendering
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **PostgreSQL** - Database
- **Prisma** - ORM
- **Socket.io** - Real-time communication
- **JWT** - Authentication

### DevOps
- **Vercel** - Frontend deployment
- **Render** - Backend deployment

## 📁 Estrutura do Projeto

```
auriplan/
├── src/
│   ├── app/              # App entry points
│   ├── core/             # Core engines (CAD, snap, collision, etc.)
│   ├── engine/           # Rendering engines (2D, 3D)
│   ├── features/         # Feature modules
│   │   └── editor/       # Editor feature
│   ├── hooks/            # Custom React hooks
│   ├── library/          # Furniture catalog
│   ├── model/            # Data models
│   ├── store/            # Zustand stores
│   ├── styles/           # Global styles
│   └── types/            # TypeScript types
├── server/               # Backend API
│   ├── src/
│   │   ├── db/           # Database
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── websocket/    # Socket.io handlers
│   └── prisma/           # Prisma schema
├── public/               # Static assets
└── docs/                 # Documentation
```

## 🛠️ Instalação

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Frontend

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/auriaplan.git
cd auriaplan

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações

# Inicie o servidor de desenvolvimento
npm run dev
```

### Backend

```bash
# Navegue para a pasta do servidor
cd server

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações

# Execute as migrações do banco de dados
npx prisma migrate dev

# Gere o cliente Prisma
npx prisma generate

# Inicie o servidor
npm run dev
```

## 📝 Scripts

### Frontend
- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Compila para produção
- `npm run preview` - Visualiza a build de produção
- `npm run lint` - Executa o ESLint
- `npm run type-check` - Verifica tipos TypeScript

### Backend
- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Compila TypeScript
- `npm start` - Inicia o servidor de produção
- `npm run db:migrate` - Executa migrações
- `npm run db:seed` - Popula o banco de dados

## 🚀 Deploy

### Vercel (Frontend)

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

```bash
# Deploy manual
vercel --prod
```

### Render (Backend)

1. Crie um novo Web Service no Render
2. Conecte seu repositório
3. Configure:
   - Build Command: `cd server && npm install && npm run build`
   - Start Command: `cd server && npm start`
4. Adicione um PostgreSQL database

Ou use o `render.yaml` para deploy Blueprint:

```bash
# O Render detectará automaticamente o render.yaml
```

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Executar testes com coverage
npm run test:coverage

# Executar testes em modo watch
npm run test:watch
```

## 📚 Documentação

- [Guia do Usuário](./docs/user-guide.md)
- [API Reference](./docs/api-reference.md)
- [Arquitetura](./docs/architecture.md)
- [Contribuição](./docs/contributing.md)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](./LICENSE) para detalhes.

## 🙏 Agradecimentos

- [Three.js](https://threejs.org/) - 3D Library
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) - React renderer for Three.js
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

## 📞 Suporte

- Email: suporte@auriplan.com
- Discord: [Join our server](https://discord.gg/auriplan)
- Issues: [GitHub Issues](https://github.com/seu-usuario/auriplan/issues)

---

<p align="center">
  Feito com ❤️ pela equipe AuriPlan
</p>
