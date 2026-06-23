import { GoogleGenAI } from "@google/genai";
import type { ZodType } from "zod";

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export class GeminiConfigurationError extends Error {
  constructor() {
    super("GEMINI_API_KEY is not configured");
    this.name = "GeminiConfigurationError";
  }
}

export class GeminiResponseError extends Error {
  constructor(message = "Gemini returned an invalid response") {
    super(message);
    this.name = "GeminiResponseError";
  }
}

export function getGeminiConfig(
  environment?: { GEMINI_API_KEY?: string; GEMINI_MODEL?: string }
) {
  const resolvedEnvironment = environment ?? process.env;
  const apiKey = resolvedEnvironment.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new GeminiConfigurationError();
  }

  return {
    apiKey,
    model: resolvedEnvironment.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL
  };
}

export async function generateGeminiJson<T>({
  prompt,
  schema,
  responseJsonSchema
}: {
  prompt: string;
  schema: ZodType<T>;
  responseJsonSchema: unknown;
}): Promise<T> {
  const { apiKey, model } = getGeminiConfig();
  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema,
      temperature: 0.2,
      maxOutputTokens: 4096
    }
  });
  const rawText = response.text?.trim();

  if (!rawText) {
    throw new GeminiResponseError("Gemini returned an empty response");
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    throw new GeminiResponseError("Gemini response was not valid JSON");
  }

  const parsed = schema.safeParse(parsedJson);

  if (!parsed.success) {
    throw new GeminiResponseError("Gemini response did not match the expected schema");
  }

  return parsed.data;
}
