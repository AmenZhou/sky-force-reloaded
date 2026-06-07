import { VALID_ACTIONS } from './heuristic.js';

const SYSTEM_PROMPT = `You are an expert AI playing a vertical shoot-em-up (Sky Force style).

Goal: survive, maximize score and wave, minimize hits.

Rules:
- Ship auto-fires; you only choose movement each turn.
- Shield depletes on hits; at 0 you lose a life (3 total).
- Enemy bullets move toward you; dodge by moving away from bullet clusters.
- Collect W (weapon) and S (shield) pickups when nearby and beneficial.

Output ONLY valid JSON (no markdown):
{"action":"move_left"|"move_right"|"move_up"|"move_down"|"wait","reasoning":"one short sentence"}`;

export async function createLLM(modelArg) {
  if (modelArg === 'claude') {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic();
    return {
      name: 'claude-haiku-4-5',
      ask: async (userContent) => {
        const msg = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 120,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userContent }],
        });
        return msg.content[0].text.trim();
      },
    };
  }

  const { default: OpenAI } = await import('openai');
  const client = new OpenAI();
  const model = modelArg === 'openai-mini' ? 'gpt-4o-mini' : 'gpt-4.1-nano';
  return {
    name: model,
    ask: async (userContent) => {
      const res = await client.chat.completions.create({
        model,
        max_tokens: 120,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
      });
      return res.choices[0].message.content.trim();
    },
  };
}

function compactState(state) {
  return {
    score: state.score,
    wave: state.wave,
    lives: state.lives,
    shieldPct: state.shieldPct,
    weaponLevel: state.weaponLevel,
    combo: state.combo,
    playerX: state.playerX,
    playerY: state.playerY,
    enemyBulletCount: (state.enemyBullets || []).length,
    nearestBullets: (state.enemyBullets || [])
      .filter((b) => b.vy > 0 && b.y > state.playerY - 150)
      .slice(0, 8)
      .map((b) => ({ x: b.x, y: b.y })),
    powerups: state.powerups || [],
  };
}

export async function pickLLMMove(state, turn, llm, logger) {
  const fallback = 'move_left';
  if (!state?.running) return 'wait';

  const userContent = `Turn ${turn}. State:\n${JSON.stringify(compactState(state))}`;
  try {
    const raw = await llm.ask(userContent);
    const parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ''));
    const action = parsed.action;
    if (!VALID_ACTIONS.has(action) || action === 'hold_slowmo') {
      logger?.write({ type: 'override', turn, reason: 'invalid_llm_action', raw: action });
      return fallback;
    }
    logger?.write({ type: 'llm', turn, action, reasoning: parsed.reasoning || '' });
    return action;
  } catch (err) {
    logger?.write({ type: 'error', turn, kind: 'llm_parse', message: err.message });
    return fallback;
  }
}
