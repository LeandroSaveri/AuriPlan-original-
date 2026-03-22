/**
 * AIInterpreterService - Serviço de Interpretação de IA (Backend)
 * Responsável por conectar com o modelo de linguagem (OpenAI ou equivalente)
 */

import OpenAI from 'openai';

export interface InterpretCommandRequest {
  prompt: string;
  context?: string;
  language?: 'pt' | 'en';
  model?: string;
}

export interface InterpretCommandResponse {
  success: boolean;
  result?: any;
  error?: string;
  tokensUsed?: number;
}

export class AIInterpreterService {
  private openai: OpenAI | null = null;
  private defaultModel = 'gpt-4o-mini';
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.isInitialized = true;
      console.log('AIInterpreterService initialized with OpenAI');
    } else {
      console.warn('OPENAI_API_KEY not set. AI features will use fallback mode.');
    }
  }

  /**
   * Interpreta um comando em linguagem natural usando LLM
   */
  public async interpretCommand(
    request: InterpretCommandRequest
  ): Promise<InterpretCommandResponse> {
    try {
      // Se não houver OpenAI configurado, retornar erro
      if (!this.openai) {
        return {
          success: false,
          error: 'AI service not configured. Please set OPENAI_API_KEY.',
        };
      }

      const systemPrompt = this.buildSystemPrompt(request.language);
      const userPrompt = this.buildUserPrompt(request);

      const response = await this.openai.chat.completions.create({
        model: request.model || this.defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        return {
          success: false,
          error: 'Empty response from AI',
        };
      }

      // Parse da resposta JSON
      const result = JSON.parse(content);

      // Validar estrutura
      if (!this.validateInterpretation(result)) {
        return {
          success: false,
          error: 'Invalid response structure from AI',
        };
      }

      return {
        success: true,
        result,
        tokensUsed: response.usage?.total_tokens,
      };
    } catch (error) {
      console.error('AI interpretation error:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI interpretation failed',
      };
    }
  }

  /**
   * Gera sugestões de comandos baseadas no contexto
   */
  public async generateSuggestions(context?: string): Promise<string[]> {
    if (!this.openai) {
      return this.getDefaultSuggestions();
    }

    try {
      const prompt = `Generate 5 natural language commands for an interior design CAD application.
Context: ${context || 'General home design'}

Respond with a JSON array of strings. Example:
["criar uma casa com 2 quartos", "adicionar cozinha moderna", "colocar sofá na sala"]`;

      const response = await this.openai.chat.completions.create({
        model: this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return this.getDefaultSuggestions();

      const result = JSON.parse(content);
      return Array.isArray(result.suggestions) ? result.suggestions : result;
    } catch {
      return this.getDefaultSuggestions();
    }
  }

  /**
   * Constrói o prompt do sistema
   */
  private buildSystemPrompt(language?: string): string {
    const isPortuguese = language === 'pt';

    return `You are an AI assistant for AuriPlan, a professional interior design CAD application.
Your task is to interpret natural language commands and convert them into structured JSON for floor plan generation.

${isPortuguese ? 'O usuário pode escrever em português ou inglês.' : 'The user may write in Portuguese or English.'}

You must respond with a valid JSON object in the following format:

{
  "intent": "create" | "add" | "modify" | "delete" | "move",
  "target": "house" | "room" | "furniture" | "wall" | "door" | "window",
  "targetType": "specific type like bedroom, kitchen, sofa, etc",
  "specifications": {
    "roomType": "type of room",
    "size": number (area in square meters),
    "dimensions": { "width": number, "height": number, "depth": number },
    "count": number (quantity),
    "style": "style description",
    "color": "color hex code",
    "material": "material name"
  },
  "location": "where to place (e.g., 'na sala', 'in the kitchen')",
  "constraints": ["array of constraints"]
}

Room types: living_room, bedroom, kitchen, bathroom, dining_room, office, garage, hallway, balcony, garden
Furniture types: sofa, bed, table, chair, wardrobe, desk, tv_stand, bookshelf, cabinet, refrigerator, stove, sink

Examples:
- "criar uma casa com 2 quartos" -> intent: "create", target: "house", specifications: { count: 2, roomType: "bedroom" }
- "adicionar cozinha de 12 metros" -> intent: "add", target: "room", targetType: "kitchen", specifications: { size: 12 }
- "colocar sofá na sala" -> intent: "add", target: "furniture", targetType: "sofa", location: "sala"

Always return valid JSON. Do not include markdown formatting.`;
  }

  /**
   * Constrói o prompt do usuário
   */
  private buildUserPrompt(request: InterpretCommandRequest): string {
    let prompt = `Command: "${request.prompt}"`;

    if (request.context) {
      prompt += `\n\nContext: ${request.context}`;
    }

    prompt += `\n\nInterpret this command and return the JSON structure.`;

    return prompt;
  }

  /**
   * Valida a estrutura da interpretação
   */
  private validateInterpretation(data: any): boolean {
    if (!data || typeof data !== 'object') return false;

    const validIntents = ['create', 'add', 'modify', 'delete', 'move'];
    const validTargets = ['house', 'room', 'furniture', 'wall', 'door', 'window'];

    if (!validIntents.includes(data.intent)) return false;
    if (!validTargets.includes(data.target)) return false;
    if (!data.specifications || typeof data.specifications !== 'object') return false;

    return true;
  }

  /**
   * Retorna sugestões padrão
   */
  private getDefaultSuggestions(): string[] {
    return [
      'criar uma casa com 2 quartos e sala',
      'adicionar cozinha de 12 metros quadrados',
      'colocar sofá na sala',
      'criar quarto principal com banheiro',
      'adicionar escritório home office',
    ];
  }

  /**
   * Verifica se o serviço está saudável
   */
  public healthCheck(): { status: string; initialized: boolean } {
    return {
      status: this.isInitialized ? 'healthy' : 'not_configured',
      initialized: this.isInitialized,
    };
  }
}

// Singleton instance
export const aiInterpreterService = new AIInterpreterService();
