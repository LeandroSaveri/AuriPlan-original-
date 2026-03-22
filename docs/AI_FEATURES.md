# Sistema de IA de Comando Natural - AuriaPlan

## Visão Geral

O AuriaPlan agora possui um sistema completo de Inteligência Artificial que permite aos usuários criar projetos de design de interiores usando comandos em linguagem natural.

## Funcionalidades

### 1. Comandos em Linguagem Natural

O usuário pode descrever o que deseja criar em português ou inglês:

- **"criar uma casa com 2 quartos e sala grande"**
- **"adicionar uma cozinha de 12 metros quadrados"**
- **"colocar sofá na sala"**
- **"mudar o quarto para 15 metros quadrados"**

### 2. Arquitetura do Sistema de IA

```
┌─────────────────────────────────────────────────────────────┐
│                    AICommandInput.tsx                        │
│              (Interface do usuário)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    AIOrchestrator                            │
│              (Orquestrador principal)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│ AIService    │ │ Natural  │ │ FloorPlan    │
│ (Conexão    │ │ Language │ │ Generator    │
│  com LLM)    │ │ Interpreter      │ │ (Geração    │
└──────────────┘ └──────────┘ └──────────────┘
         │                              │
         │                              ▼
         │                    ┌──────────────────┐
         │                    │ EditorActionMapper│
         │                    │ (Ações do Editor) │
         │                    └────────┬─────────┘
         │                             │
         ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API                               │
│         /api/ai/interpret, /api/ai/suggestions              │
└─────────────────────────────────────────────────────────────┘
```

## Módulos Implementados

### Frontend (`src/ai/`)

| Arquivo | Descrição |
|---------|-----------|
| `AIService.ts` | Conexão com API de LLM (OpenAI) |
| `NaturalLanguageInterpreter.ts` | Interpretação local de comandos |
| `FloorPlanGenerator.ts` | Geração de estrutura de planta |
| `EditorActionMapper.ts` | Mapeamento para ações do editor |
| `AIOrchestrator.ts` | Facade que coordena todos os módulos |
| `AICommandInput.tsx` | Componente de interface do usuário |

### Backend (`server/src/services/`)

| Arquivo | Descrição |
|---------|-----------|
| `AIInterpreterService.ts` | Serviço de interpretação usando OpenAI |
| `aiRoutes.ts` | Rotas da API para funcionalidades de IA |

## API Endpoints

### POST /api/ai/interpret
Interpreta um comando em linguagem natural.

**Request:**
```json
{
  "prompt": "criar uma casa com 2 quartos",
  "language": "pt",
  "context": "optional context"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "intent": "create",
    "target": "house",
    "specifications": {
      "count": 2,
      "roomType": "bedroom"
    }
  },
  "tokensUsed": 150
}
```

### POST /api/ai/suggestions
Gera sugestões de comandos.

**Response:**
```json
{
  "success": true,
  "suggestions": [
    "criar uma casa com 2 quartos",
    "adicionar cozinha de 12 metros"
  ]
}
```

### GET /api/ai/health
Verifica a saúde do serviço de IA.

## Uso

### Componente React

```tsx
import { AICommandInput } from '@/components/AICommandInput';

function Editor() {
  const handleExecute = (result) => {
    console.log('Comando executado:', result);
  };

  return (
    <AICommandInput
      onExecute={handleExecute}
      position="top"
      showSuggestions={true}
    />
  );
}
```

### Uso Programático

```tsx
import { aiOrchestrator } from '@/ai';

// Processar comando
const result = await aiOrchestrator.processCommand(
  'criar uma casa com 2 quartos e sala'
);

if (result.success) {
  console.log('Planta gerada:', result.floorPlan);
  console.log('Ações:', result.actions);
}

// Apenas preview (sem executar)
const preview = await aiOrchestrator.previewCommand(
  'adicionar cozinha'
);
```

## Configuração

### Variáveis de Ambiente

```bash
# .env
OPENAI_API_KEY=sk-...
```

### Configuração do Serviço

```tsx
aiOrchestrator.setConfig({
  useBackendLLM: true,
  fallbackToLocal: true,
  language: 'auto', // 'pt', 'en', ou 'auto'
});
```

## Testes

```bash
# Executar testes de IA
npm test src/ai/__tests__
```

## Suporte Multi-idioma

O sistema suporta automaticamente:
- **Português (pt)**: "criar quarto", "adicionar cozinha"
- **Inglês (en)**: "create room", "add kitchen"

A detecção de idioma é automática, mas pode ser forçada:

```tsx
aiOrchestrator.setConfig({ language: 'pt' });
```

## Templates de Cômodos

| Tipo | Largura Padrão | Altura Padrão | Tamanho Mínimo |
|------|----------------|---------------|----------------|
| living_room | 5m | 4m | 12m² |
| bedroom | 3.5m | 3.5m | 9m² |
| kitchen | 3m | 3m | 6m² |
| bathroom | 2m | 2m | 3m² |
| dining_room | 4m | 4m | 12m² |
| office | 3m | 3m | 8m² |
| garage | 6m | 6m | 30m² |

## Templates de Móveis

| Tipo | Largura | Altura | Profundidade |
|------|---------|--------|--------------|
| sofa | 2m | 0.8m | 0.9m |
| bed | 1.6m | 0.5m | 2m |
| table | 1.5m | 0.75m | 0.9m |
| wardrobe | 1.5m | 2.2m | 0.6m |
| desk | 1.2m | 0.75m | 0.6m |

## Performance

- Chamadas à API são **assíncronas** e não bloqueiam a interface
- **Loading state** é exibido durante o processamento
- **Preview mode** permite visualizar antes de aplicar
- **Worker threads** processam geometria em background

## Integração com Engine Existente

A IA **NÃO** desenha diretamente. Ela chama as funções existentes:

```tsx
// Ações geradas pela IA
const actions = [
  { type: 'createRoom', payload: room },
  { type: 'createWall', payload: wall },
  { type: 'createFurniture', payload: furniture },
];

// Executadas pela engine existente
await editorActionMapper.executeBatch(actions);
```

Isso garante que:
- ✅ Toda a lógica existente continue funcionando
- ✅ Nenhuma ferramenta seja quebrada
- ✅ O projeto continue compilando normalmente

## Dependências

```json
{
  "openai": "^4.x"
}
```

## Notas de Implementação

1. **Modularidade**: O sistema de IA é completamente modular e pode ser desativado
2. **Fallback**: Se a API do OpenAI falhar, o sistema usa interpretação local
3. **Histórico**: Comandos são salvos no localStorage
4. **Sugestões**: Sugestões inteligentes baseadas no contexto
5. **Validação**: Todas as respostas da IA são validadas antes de aplicar
