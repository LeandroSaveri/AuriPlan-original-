# AuriPlan - Relatório de Arquitetura Profissional

## Resumo Executivo

Este documento descreve a arquitetura profissional completa do AuriPlan, um software de design residencial de nível internacional.

---

## 1. Auditoria e Correções

### Branding Verificado
- ✅ Todos os arquivos atualizados para "AuriPlan"
- ✅ Links de suporte atualizados (Discord, email, GitHub)
- ✅ Documentação consistente

### Correções de Código
- ✅ EventEmitter do Node.js substituído por implementação browser
- ✅ Tipos TypeScript corrigidos
- ✅ Imports atualizados

---

## 2. Motor 3D Profissional

### Arquitetura do Motor 3D

```
src/engine/render3d/
├── Render3DEngine.ts          # Motor principal
├── Render3D.tsx               # Componente React
├── ScenePartitionManager.ts   # Particionamento espacial
├── ObjectPoolManager.ts       # Pool de objetos
└── index.ts                   # Exportações
```

### Funcionalidades Implementadas

| Feature | Descrição | Status |
|---------|-----------|--------|
| Instanced Rendering | Renderização em lote de objetos repetidos | ✅ |
| LOD Manager | Níveis de detalhe automáticos | ✅ |
| Scene Partitioning | Particionamento espacial para culling | ✅ |
| Object Pooling | Reutilização de objetos para performance | ✅ |
| Frustum Culling | Ocultação de objetos fora da visão | ✅ |
| Shadow Mapping | Sombras suaves e realistas | ✅ |
| PBR Materials | Materiais físicamente baseados | ✅ |

### Otimizações de Performance

- **GPU Batching**: Objetos similares renderizados em lote
- **Scene Partitioning**: Células de 5m x 5m x 5m
- **Object Pooling**: Mínimo de 10 objetos por pool, máximo de 1000
- **Memory Management**: Cache de materiais e texturas

---

## 3. Sistema de Materiais PBR

### Arquitetura

```
src/engine/materials/
├── PBRMaterialFactory.ts      # Fábrica de materiais
└── (integrado com TextureLoader)
```

### Tipos de Materiais Suportados

| Tipo | Propriedades | Texturas |
|------|--------------|----------|
| Wood | roughness: 0.7, metalness: 0.0 | albedo, normal, roughness, ao |
| Marble | roughness: 0.1, metalness: 0.0 | albedo, normal, roughness |
| Metal | roughness: 0.3, metalness: 1.0 | albedo, normal, roughness, metallic |
| Fabric | roughness: 0.9, metalness: 0.0 | albedo, normal, ao |
| Glass | transmission: 0.95, thickness: 0.5 | - |
| Ceramic | roughness: 0.2, metalness: 0.0 | albedo, normal |
| Concrete | roughness: 0.9, metalness: 0.0 | albedo, normal, roughness, ao |
| Plastic | roughness: 0.4, metalness: 0.0 | - |

---

## 4. Sistema de Iluminação

### Arquitetura

```
src/engine/lighting/
├── LightingManager.ts         # Gerenciador de luzes
└── (HDRI support estruturado)
```

### Tipos de Luz

| Tipo | Uso | Propriedades |
|------|-----|--------------|
| Ambient | Iluminação base | intensity: 0.3 |
| Directional (Sun) | Luz principal | intensity: 1.0, castShadow: true |
| Directional (Fill) | Preenchimento | intensity: 0.3 |
| Hemisphere | Ambiente natural | sky + ground color |
| Point | Luzes pontuais | radius: 100m |
| Spot | Focos direcionais | ângulo ajustável |

### Sombras

- **Shadow Map Size**: 2048x2048 (configurável)
- **Shadow Type**: PCF Soft Shadows
- **Bias**: -0.0005
- **Camera**: 40m x 40m

---

## 5. Sistema de IA Avançado

### Arquitetura

```
src/ai/
├── index.ts
├── generators/
│   ├── floorplan/
│   │   ├── FloorPlanGenerator.ts    # Geração de plantas
│   │   └── RoomRules.ts             # Regras arquitetônicas
│   └── design/
│       └── RoomDesigner.ts          # Designer de ambientes
├── services/
│   ├── AIService.ts                 # Serviço principal
│   └── MaterialEstimator.ts         # Estimador de materiais
└── (outros módulos)
```

### Funcionalidades de IA

| Funcionalidade | Descrição | Status |
|----------------|-----------|--------|
| Generate Floor Plan | Gera plantas automáticas | ✅ |
| Auto Furnish | Mobília automática por tipo de cômodo | ✅ |
| Room Designer | Design completo com estilos | ✅ |
| Style Generator | 6 estilos: modern, classic, minimalist, industrial, scandinavian, bohemian | ✅ |
| Material Estimator | Cálculo de materiais e custos | ✅ |
| Lighting Plan | Plano de iluminação automático | ✅ |

### Estilos de Design

1. **Modern**: Cores neutras, materiais metálicos e vidro
2. **Classic**: Madeiras escuras, veludo, latão
3. **Minimalist**: Branco, madeira clara, formas simples
4. **Industrial**: Aço, concreto, couro
5. **Scandinavian**: Madeira clara, cores pastel, lã
6. **Bohemian**: Cores vibrantes, rattan, tecidos estampados

---

## 6. Sistema de Assets (CDN)

### Arquitetura

```
src/services/assets/
├── AssetService.ts            # Serviço de assets
├── ModelLoader.ts             # Carregador de modelos
├── TextureLoader.ts           # Carregador de texturas
└── index.ts

src/config/
└── cdn.config.ts              # Configuração de CDN
```

### Configuração CDN

```typescript
{
  baseUrl: 'https://cdn.auriplan.com',
  modelsPath: '/models/v1',
  texturesPath: '/textures/v1',
  materialsPath: '/materials/v1',
  thumbnailsPath: '/thumbnails/v1',
  cacheEnabled: true,
  cacheDuration: 24, // horas
}
```

### Funcionalidades

- ✅ Lazy loading de assets
- ✅ Cache via IndexedDB
- ✅ Streaming progressivo
- ✅ Fallback offline
- ✅ Suporte a GLB/GLTF
- ✅ Suporte a texturas PBR

---

## 7. Biblioteca de Assets

### Estrutura

```
assets/
├── models/                    # Modelos 3D otimizados
├── textures/                  # Texturas PBR
└── materials/                 # Definições de materiais
```

### Categorias

- furniture
- kitchen
- bathroom
- bedroom
- livingroom
- lighting
- decor

### Especificações

- **Formato**: GLB (GLTF 2.0)
- **Tamanho máximo**: 2MB por modelo
- **Polígonos**: Low-poly otimizado
- **Texturas**: JPG/PNG, máximo 2K

---

## 8. Sistema de Workers

### Arquitetura

```
src/workers/
├── floorplanWorker.ts         # Worker de plantas
└── index.ts                   # Hook useFloorPlanWorker
```

### Funcionalidades

- ✅ Execução em background
- ✅ Progress reporting
- ✅ Cancelamento de operações
- ✅ Comunicação via postMessage

---

## 9. Estimador de Materiais (BOM)

### Funcionalidades

| Categoria | Materiais Calculados |
|-----------|---------------------|
| Walls | Tijolos, cimento, areia, gesso, tinta |
| Floors | Pisos (cerâmica, madeira, laminado), subpiso |
| Ceilings | Drywall, tinta |
| Electrical | Tomadas, interruptores, fiação |
| Plumbing | Louças, torneiras, tubulação |

### Cálculos

- **Tijolos**: 60 unidades/m²
- **Cimento**: 15 kg/m²
- **Areia**: 30 kg/m²
- **Tinta**: 0.3 L/m²
- **Mão de obra**: $45/m² (paredes)

---

## 10. Performance

### Métricas Monitoradas

| Métrica | Target | Método |
|---------|--------|--------|
| FPS | > 60 | Render3DEngine.getStats() |
| Draw Calls | < 500 | Three.js renderer.info |
| Triangles | < 1M | Three.js renderer.info |
| Memory | < 500MB | Chrome DevTools |

### Otimizações

1. **Instanced Rendering**: Reduz draw calls para objetos repetidos
2. **LOD System**: Menos polígonos para objetos distantes
3. **Frustum Culling**: Não renderiza objetos fora da visão
4. **Texture Compression**: KTX2 para texturas menores
5. **Geometry Instancing**: Para móveis repetidos

---

## 11. Deploy

### Configurações

#### Vercel (Frontend)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

#### Render (Backend)

```yaml
services:
  - type: web
    name: auriplan-server
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
```

### Variáveis de Ambiente

```bash
# Frontend
VITE_CDN_BASE_URL=https://cdn.auriplan.com
VITE_API_URL=https://api.auriplan.com
VITE_AI_API_URL=https://api.auriplan.com/ai

# Backend
DATABASE_URL=postgresql://...
JWT_SECRET=...
OPENAI_API_KEY=...
```

---

## 12. Lista de Arquivos Criados/Alterados

### Novos Arquivos (20+)

```
src/
├── config/cdn.config.ts
├── engine/
│   ├── render3d/
│   │   ├── ScenePartitionManager.ts
│   │   └── ObjectPoolManager.ts
│   ├── materials/
│   │   └── PBRMaterialFactory.ts
│   └── lighting/
│       └── LightingManager.ts
├── ai/
│   ├── generators/design/
│   │   └── RoomDesigner.ts
│   └── services/
│       └── MaterialEstimator.ts
├── services/assets/
│   ├── AssetService.ts
│   ├── ModelLoader.ts
│   ├── TextureLoader.ts
│   └── index.ts
├── workers/
│   ├── floorplanWorker.ts
│   └── index.ts
└── utils/
    └── EventEmitter.ts
```

### Arquivos Modificados

- README.md
- CHANGELOG.md
- docs/*.md
- server/package.json
- scripts/seed.js

---

## 13. Instruções para Rodar Localmente

### 1. Instalação

```bash
git clone https://github.com/seu-usuario/auriplan.git
cd auriplan
npm install
cd server && npm install && cd ..
```

### 2. Configuração

```bash
cp .env.example .env
# Edite .env com suas configurações
```

### 3. Executar

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
cd server
npm run dev
```

### 4. Acessar

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

---

## 14. Instruções para Deploy

### Vercel (Frontend)

```bash
npm run build
vercel --prod
```

### Render (Backend)

```bash
cd server
npm run build
# Deploy via dashboard ou CLI
```

---

## 15. Próximos Passos

### Funcionalidades Futuras

1. **Marketplace de Móveis**
   - Upload de modelos 3D
   - Sistema de avaliação
   - Integração de pagamentos

2. **Realidade Virtual**
   - Suporte a WebXR
   - Visualização imersiva

3. **Colaboração em Tempo Real**
   - Multiusuário
   - Sincronização via WebSocket

4. **Exportação Profissional**
   - DWG/DXF
   - PDF de alta qualidade
   - Renderização em nuvem

---

## Conclusão

O AuriPlan foi desenvolvido com arquitetura profissional completa:

✅ Motor 3D otimizado com LOD, culling e instancing
✅ Sistema de materiais PBR completo
✅ Iluminação realista com sombras suaves
✅ IA avançada para design automático
✅ Estimador de materiais (BOM)
✅ CDN escalável para assets
✅ Arquitetura modular e escalável

O sistema está pronto para suportar milhares de usuários e expandir com novas funcionalidades profissionais.

---

**Data:** 2024-03-10
**Versão:** 2.0.0 Professional
**Status:** ✅ Pronto para Deploy
