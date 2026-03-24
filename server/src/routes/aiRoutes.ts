/**
 * AI Routes - Rotas da API para funcionalidades de IA
 */

import { Router, Request, Response } from 'express';
import { aiInterpreterService } from '../services/AIInterpreterService.js';

const router = Router();

/**
 * POST /api/ai/interpret
 * Interpreta um comando em linguagem natural
 */
router.post('/interpret', async (req: Request, res: Response) => {
  try {
    const { prompt, context, language, model } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required',
      });
    }

    const result = await aiInterpreterService.interpretCommand({
      prompt,
      context,
      language,
      model,
    });

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error in /interpret:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/ai/suggestions
 * Gera sugestões de comandos
 */
router.post('/suggestions', async (req: Request, res: Response) => {
  try {
    const { context } = req.body;

    const suggestions = await aiInterpreterService.generateSuggestions(context);

    return res.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error('Error in /suggestions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate suggestions',
    });
  }
});

/**
 * GET /api/ai/health
 * Verifica a saúde do serviço de IA
 */
router.get('/health', (req: Request, res: Response) => {
  const health = aiInterpreterService.healthCheck();
  return res.json(health);
});

export default router;
