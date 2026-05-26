import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { GenerateGameBody, GenerateGameResponse, ReshuffleArchetypesBody, ReshuffleArchetypesResponse } from "@workspace/api-zod";
import { buildBunkerPrompt } from "./prompt";

const router: IRouter = Router();

function getOpenRouterClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
  });
}

router.post("/bunker/generate", async (req, res): Promise<void> => {
  const parsed = GenerateGameBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { apocalypseType, playerCount } = parsed.data;

  let client: OpenAI;
  try {
    client = getOpenRouterClient();
  } catch (err) {
    req.log.error({ err }, "OpenRouter client initialization failed");
    res.status(500).json({ error: "AI service not configured. Set OPENROUTER_API_KEY." });
    return;
  }

  req.log.info({ apocalypseType, playerCount }, "Generating bunker game via OpenRouter");

  try {
    const prompt = buildBunkerPrompt(apocalypseType, playerCount);

    const completion = await client.chat.completions.create({
      model: "google/gemini-2.0-flash-001",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 8192,
    });

    let rawText = (completion.choices[0]?.message?.content ?? "").trim();

    rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");

    let gameData: unknown;
    try {
      gameData = JSON.parse(rawText);
    } catch (parseErr) {
      req.log.error({ parseErr, rawText: rawText.slice(0, 500) }, "Failed to parse AI JSON response");
      res.status(500).json({ error: "Failed to parse AI response as JSON" });
      return;
    }

    const validated = GenerateGameResponse.safeParse(gameData);
    if (!validated.success) {
      req.log.error({ errors: validated.error.message }, "AI response failed schema validation");
      res.status(500).json({ error: "AI response did not match expected schema" });
      return;
    }

    req.log.info("Game generated successfully");
    res.json(validated.data);
  } catch (err) {
    req.log.error({ err }, "Failed to generate game");
    res.status(500).json({ error: "Failed to generate game. Check your API key." });
  }
});

router.post("/bunker/reshuffle", async (req, res): Promise<void> => {
  const parsed = ReshuffleArchetypesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { players } = parsed.data;

  const shuffled = players.map((player) => {
    const shouldShuffle = Math.random() < 0.4;
    if (!shouldShuffle || players.length < 2) return player;

    const otherIdx = Math.floor(Math.random() * players.length);
    const other = players[otherIdx];
    if (!other || other.id === player.id) return player;

    const fields: Array<keyof typeof player> = ["hobby", "phobia", "baggage", "additionalInfo", "actionCard", "conditionCard"];
    const randomField = fields[Math.floor(Math.random() * fields.length)];
    if (!randomField) return player;

    return {
      ...player,
      [randomField]: other[randomField],
    };
  });

  const validated = ReshuffleArchetypesResponse.safeParse({ players: shuffled });
  if (!validated.success) {
    res.status(500).json({ error: "Reshuffle produced invalid data" });
    return;
  }

  res.json(validated.data);
});

export default router;
