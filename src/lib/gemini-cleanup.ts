import type { SrtSegment } from "./transcribe";

/**
 * Conservative Gemini post-processing for raw FARUKxAUTO output.
 *
 * What it does: fixes clear spelling/encoding errors and obvious garbled
 * Tunisian Darija words, restores mangled French/English words to their
 * native script, normalizes punctuation.
 *
 * What it must NOT do: invent content, change meaning, or "fill in" words the
 * model couldn't hear. Gemini never heard the audio — a confident wrong guess
 * is worse than a garbled-but-honest one. The prompt enforces this.
 *
 * Segment count and order are preserved 1:1 so timestamps stay valid. If the
 * model returns the wrong number of segments, we discard its output and keep
 * the original (fail-safe — never lose the real transcript).
 */

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = (model: string, key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

const SYSTEM_PROMPT = `You are a careful proofreader for Tunisian Arabic (Darija) subtitle transcripts produced by a speech-to-text model.

You will receive a JSON array of subtitle segments. Each has an "index" and "text".

Your job: return the SAME array, same length, same order, same indexes, with ONLY the "text" cleaned up.

Rules — follow EXACTLY:
1. Fix obvious spelling errors and clearly garbled/mojibake words in Tunisian Darija.
2. If a French or English word was mangled into Arabic letters, restore it to its correct Latin spelling (e.g. transliterated "تست" said as "test" → "test").
3. Normalize spacing and punctuation.
4. DO NOT invent or add words. DO NOT remove meaningful words.
5. DO NOT change the meaning of any segment.
6. If a word is ambiguous or you are not confident, LEAVE IT UNCHANGED. A wrong guess is worse than leaving it.
7. Keep the exact same number of segments and the exact same "index" values.
8. Keep Arabic in Arabic script and Latin words in Latin script.

Return ONLY valid JSON: an array of objects with "index" (number) and "text" (string). No markdown, no commentary.`;

type CleanupInput = { index: number; text: string };

/**
 * Run the cleanup. Returns new segments with corrected text, or the original
 * segments unchanged if Gemini is unconfigured/errors/returns bad output.
 * This function never throws — transcription must succeed even if cleanup fails.
 */
export async function cleanupSegments(
  segments: SrtSegment[]
): Promise<SrtSegment[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || segments.length === 0) return segments;

  const input: CleanupInput[] = segments.map((s) => ({
    index: s.index,
    text: s.text,
  }));

  try {
    const res = await fetch(GEMINI_ENDPOINT(GEMINI_MODEL, key), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [{ text: JSON.stringify(input) }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
      // Don't let a slow Gemini call hang the whole transcription response.
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      console.error("[gemini-cleanup] non-200:", res.status);
      return segments;
    }

    const data = await res.json();
    const raw: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return segments;

    const parsed = JSON.parse(raw) as CleanupInput[];
    if (!Array.isArray(parsed) || parsed.length !== segments.length) {
      // Wrong shape/length → don't trust it, keep the real transcript.
      console.error("[gemini-cleanup] length mismatch, discarding");
      return segments;
    }

    // Merge cleaned text back by index, preserving original timestamps.
    const byIndex = new Map(parsed.map((p) => [p.index, p.text]));
    return segments.map((seg) => {
      const cleaned = byIndex.get(seg.index);
      return cleaned && typeof cleaned === "string"
        ? { ...seg, text: cleaned.trim() }
        : seg;
    });
  } catch (err) {
    console.error("[gemini-cleanup] failed, keeping original:", err);
    return segments;
  }
}
