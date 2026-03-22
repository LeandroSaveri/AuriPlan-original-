// ============================================
// AI ASSISTANT - Assistente de Design com IA
// ============================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useEditorStore } from '@store/editorStore';
import { 
  Sparkles, 
  X, 
  Sofa, 
  Bed, 
  Utensils, 
  Bath, 
  Briefcase,
  Loader2,
  Check,
  RefreshCw,
  Lightbulb,
  Palette
} from 'lucide-react';
import type { RoomType } from '@types';

interface AIAssistantProps {
  onClose: () => void;
}

type DesignStyle = 'modern' | 'classic' | 'minimalist' | 'industrial' | 'scandinavian' | 'bohemian' | 'luxury';

interface DesignSuggestion {
  id: string;
  name: string;
  description: string;
  furniture: Array<{
    name: string;
    position: string;
  }>;
  colors: {
    wall: string;
    floor: string;
  };
}

const roomTypes: Array<{ id: RoomType; name: string; icon: React.ElementType }> = [
  { id: 'living', name: 'Sala de Estar', icon: Sofa },
  { id: 'bedroom', name: 'Quarto', icon: Bed },
  { id: 'kitchen', name: 'Cozinha', icon: Utensils },
  { id: 'bathroom', name: 'Banheiro', icon: Bath },
  { id: 'dining', name: 'Sala de Jantar', icon: Utensils },
  { id: 'office', name: 'Escritório', icon: Briefcase },
];

const designStyles: Array<{ id: DesignStyle; name: string; description: string }> = [
  { id: 'modern', name: 'Moderno', description: 'Linhas limpas e minimalismo' },
  { id: 'classic', name: 'Clássico', description: 'Elegância atemporal' },
  { id: 'minimalist', name: 'Minimalista', description: 'Simplicidade e funcionalidade' },
  { id: 'industrial', name: 'Industrial', description: 'Metal e madeira rústica' },
  { id: 'scandinavian', name: 'Escandinavo', description: 'Leve e acolhedor' },
  { id: 'bohemian', name: 'Boêmio', description: 'Colorido e eclético' },
  { id: 'luxury', name: 'Luxo', description: 'Materiais premium' },
];

const mockSuggestions: Record<RoomType, DesignSuggestion[]> = {
  living: [
    {
      id: '1',
      name: 'Sala Moderna Aconchegante',
      description: 'Um layout perfeito para relaxar e receber visitas',
      furniture: [
        { name: 'Sofá 3 lugares', position: 'Centro da parede principal' },
        { name: 'Poltronas (2)', position: 'Laterais do sofá' },
        { name: 'Mesa de centro', position: 'Frente ao sofá' },
        { name: 'Rack TV', position: 'Parede oposta' },
        { name: 'Tapete grande', position: 'Área central' },
      ],
      colors: { wall: '#F5F5F5', floor: '#8B7355' },
    },
    {
      id: '2',
      name: 'Sala Minimalista',
      description: 'Design limpo com foco em funcionalidade',
      furniture: [
        { name: 'Sofá modular', position: 'Configuração em L' },
        { name: 'Mesa lateral', position: 'Ao lado do sofá' },
        { name: 'Estante', position: 'Canto da sala' },
        { name: 'Luminária de piso', position: 'Próximo à leitura' },
      ],
      colors: { wall: '#FFFFFF', floor: '#C0C0C0' },
    },
  ],
  bedroom: [
    {
      id: '3',
      name: 'Quarto Principal Luxuoso',
      description: 'Ambiente sofisticado para descanso',
      furniture: [
        { name: 'Cama King', position: 'Centro da parede principal' },
        { name: 'Criados-mudos (2)', position: 'Laterais da cama' },
        { name: 'Cômoda', position: 'Parede oposta' },
        { name: 'Poltrona', position: 'Canto próximo à janela' },
      ],
      colors: { wall: '#FAF0E6', floor: '#DEB887' },
    },
  ],
  kitchen: [
    {
      id: '4',
      name: 'Cozinha Funcional',
      description: 'Layout otimizado para preparo de refeições',
      furniture: [
        { name: 'Ilha central', position: 'Centro da cozinha' },
        { name: 'Mesa jantar', position: 'Área de refeições' },
        { name: 'Armários', position: 'Paredes laterais' },
        { name: 'Geladeira', position: 'Canto próximo à entrada' },
      ],
      colors: { wall: '#FFFFFF', floor: '#A9A9A9' },
    },
  ],
  bathroom: [
    {
      id: '5',
      name: 'Banheiro Spa',
      description: 'Ambiente relaxante inspirado em spas',
      furniture: [
        { name: 'Banheira', position: 'Canto com vista' },
        { name: 'Gabinete', position: 'Parede principal' },
        { name: 'Box vidro', position: 'Área de banho' },
      ],
      colors: { wall: '#E0F6FF', floor: '#87CEEB' },
    },
  ],
  dining: [
    {
      id: '6',
      name: 'Sala de Jantar Elegante',
      description: 'Perfeita para jantares em família',
      furniture: [
        { name: 'Mesa 8 lugares', position: 'Centro da sala' },
        { name: 'Cadeiras (8)', position: 'Ao redor da mesa' },
        { name: 'Buffet', position: 'Parede lateral' },
        { name: 'Lustre', position: 'Acima da mesa' },
      ],
      colors: { wall: '#FFF8DC', floor: '#654321' },
    },
  ],
  office: [
    {
      id: '7',
      name: 'Home Office Produtivo',
      description: 'Espaço otimizado para trabalho em casa',
      furniture: [
        { name: 'Escrivaninha', position: 'Próximo à janela' },
        { name: 'Cadeira ergonômica', position: 'Frente à mesa' },
        { name: 'Estante', position: 'Parede lateral' },
        { name: 'Luminária mesa', position: 'Sobre a escrivaninha' },
      ],
      colors: { wall: '#F0F0F0', floor: '#8B4513' },
    },
  ],
  custom: [],
};

export function AIAssistant({ onClose }: AIAssistantProps) {
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<DesignStyle>('modern');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<DesignSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<DesignSuggestion | null>(null);

  const { addFurniture, addRoom } = useEditorStore();

  const handleGenerate = async () => {
    if (!selectedRoom) return;

    setIsGenerating(true);
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const roomSuggestions = mockSuggestions[selectedRoom] || [];
    setSuggestions(roomSuggestions);
    setIsGenerating(false);
  };

  const handleApply = (suggestion: DesignSuggestion) => {
    // Apply the design suggestion
    // This would add furniture and set colors
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl max-h-[90vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-gradient-to-r from-purple-900/50 to-pink-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Assistente de Design IA</h2>
              <p className="text-xs text-slate-400">Gere designs profissionais automaticamente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {!selectedSuggestion ? (
            <div className="space-y-6">
              {/* Room Selection */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <Sofa className="w-4 h-4" />
                  Selecione o tipo de cômodo
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {roomTypes.map((room) => {
                    const Icon = room.icon;
                    return (
                      <button
                        key={room.id}
                        onClick={() => setSelectedRoom(room.id)}
                        className={`p-4 rounded-xl border transition-all ${
                          selectedRoom === room.id
                            ? 'bg-blue-500/20 border-blue-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-6 h-6 mx-auto mb-2" />
                        <span className="text-sm">{room.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Style Selection */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Escolha o estilo
                </h3>
                <div className="flex flex-wrap gap-2">
                  {designStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${
                        selectedStyle === style.id
                          ? 'bg-purple-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!selectedRoom || isGenerating}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gerando design...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Gerar Design
                  </>
                )}
              </button>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-slate-300">Sugestões de Design</h3>
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      onClick={() => setSelectedSuggestion(suggestion)}
                      className="p-4 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer hover:border-purple-500/50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-white">{suggestion.name}</h4>
                        <div className="flex gap-1">
                          <div
                            className="w-6 h-6 rounded border border-slate-600"
                            style={{ backgroundColor: suggestion.colors.wall }}
                            title="Cor da parede"
                          />
                          <div
                            className="w-6 h-6 rounded border border-slate-600"
                            style={{ backgroundColor: suggestion.colors.floor }}
                            title="Cor do piso"
                          />
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 mb-3">{suggestion.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestion.furniture.slice(0, 3).map((item, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-slate-700 rounded text-slate-300">
                            {item.name}
                          </span>
                        ))}
                        {suggestion.furniture.length > 3 && (
                          <span className="text-xs px-2 py-1 bg-slate-700 rounded text-slate-400">
                            +{suggestion.furniture.length - 3} mais
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <button
                onClick={() => setSelectedSuggestion(null)}
                className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
              >
                ← Voltar
              </button>

              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">{selectedSuggestion.name}</h3>
                <p className="text-slate-400">{selectedSuggestion.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800 rounded-xl">
                  <span className="text-xs text-slate-500">Cor das Paredes</span>
                  <div className="flex items-center gap-3 mt-2">
                    <div
                      className="w-12 h-12 rounded-lg border border-slate-600"
                      style={{ backgroundColor: selectedSuggestion.colors.wall }}
                    />
                    <span className="text-sm text-white font-mono">{selectedSuggestion.colors.wall}</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-800 rounded-xl">
                  <span className="text-xs text-slate-500">Cor do Piso</span>
                  <div className="flex items-center gap-3 mt-2">
                    <div
                      className="w-12 h-12 rounded-lg border border-slate-600"
                      style={{ backgroundColor: selectedSuggestion.colors.floor }}
                    />
                    <span className="text-sm text-white font-mono">{selectedSuggestion.colors.floor}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3">Móveis Sugeridos</h4>
                <div className="space-y-2">
                  {selectedSuggestion.furniture.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                      <span className="text-sm text-white">{item.name}</span>
                      <span className="text-xs text-slate-500">{item.position}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleApply(selectedSuggestion)}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Aplicar Design
                </button>
                <button
                  onClick={handleGenerate}
                  className="px-4 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 flex items-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Nova Sugestão
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
