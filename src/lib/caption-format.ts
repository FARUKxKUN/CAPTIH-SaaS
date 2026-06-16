import type { SrtSegment } from "./transcribe";

/**
 * Caption formatting — groups word-level segments into display-ready cues.
 * Two chunking modes (by words / by characters) plus uppercase and
 * punctuation-aware options. Runs client-side so export re-chunks instantly
 * from the stored cleaned words, with no re-transcription or re-cleanup.
 *
 * Input: word-level SrtSegment[] (each item ≈ one cleaned word, real timestamps).
 * Output: caption-level SrtSegment[] (re-indexed 1..N).
 */

export type ChunkMode = "words" | "characters";

export type CaptionSettings = {
  mode: ChunkMode;
  /** words mode: max words per caption. */
  wordsPerChunk: number;
  /** characters mode: max characters per caption. */
  maxChars: number;
  /** Force Latin text uppercase (Arabic is unaffected — it has no case). */
  uppercase: boolean;
  /** Start a new caption after sentence-ending punctuation (. ? ! ؟). */
  punctuationAware: boolean;
};

export const DEFAULT_CAPTION_SETTINGS: CaptionSettings = {
  mode: "words",
  wordsPerChunk: 3,
  maxChars: 42,
  uppercase: false,
  punctuationAware: false,
};

export const CAPTION_LIMITS = {
  wordsPerChunk: { min: 1, max: 15, step: 1 },
  maxChars: { min: 10, max: 80, step: 1 },
} as const;

const SENTENCE_END = /[.!?؟…]$/;

/**
 * Group cleaned words into caption cues per the settings. Timestamps come from
 * the first word's start and last word's end, so timing stays real.
 */
export function groupWordsIntoCaptions(
  words: readonly SrtSegment[],
  settings: CaptionSettings
): SrtSegment[] {
  if (words.length === 0) return [];

  type Cue = { startMs: number; endMs: number; words: string[]; chars: number };
  const cues: Cue[] = [];
  let current: Cue | null = null;

  const flush = () => {
    if (current) {
      cues.push(current);
      current = null;
    }
  };

  for (const w of words) {
    const word = w.text.trim();
    if (!word) continue;

    if (!current) {
      current = { startMs: w.startMs, endMs: w.endMs, words: [word], chars: word.length };
    } else {
      const wouldChars = current.chars + 1 + word.length;
      const wouldWords = current.words.length + 1;
      const overflow =
        settings.mode === "words"
          ? wouldWords > settings.wordsPerChunk
          : wouldChars > settings.maxChars;

      if (overflow) {
        flush();
        current = { startMs: w.startMs, endMs: w.endMs, words: [word], chars: word.length };
      } else {
        current.words.push(word);
        current.chars = wouldChars;
        current.endMs = w.endMs;
      }
    }

    // Punctuation-aware: end the cue when this word closes a sentence.
    if (settings.punctuationAware && current && SENTENCE_END.test(word)) {
      flush();
    }
  }
  flush();

  return cues.map((cue, i) => {
    let text = cue.words.join(" ");
    if (settings.uppercase) text = text.toUpperCase();
    return {
      index: i + 1,
      startMs: cue.startMs,
      endMs: cue.endMs,
      text,
    };
  });
}
