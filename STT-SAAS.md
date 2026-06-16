# Captih

> The first subtitle tool that actually speaks Tunisian. Drop a video, get a perfect SRT. Built on FARUKxAUTO — the largest Tunisian dialect dataset trained today.

---

## Brand at a glance

| | |
|---|---|
| **Name** | Captih |
| **Meaning** | Caption + capture (EN) · "catch it / capture it" — Tunisian darija imperative |
| **Tagline** | Captih the sound. |
| **Hero line** | The first subtitle tool that actually speaks Tunisian. |
| **Arabic strap** | captih — تكتب كيف تحكي *(writes how you speak)* |
| **Founder brand** | Built by [@faruk_automates](https://instagram.com/faruk_automates) |
| **Sibling product** | [[KALIMTU]] *(same underlying model, different surface)* |

---

## What Captih is

A SaaS product where users upload any video or audio file and get back:
1. A downloadable `.srt` subtitle file
2. A full text transcript

Powered by **FARUKxAUTO** — Whisper large-v3 fine-tuned on 93 hours of Tunisian Arabic. This is the commercial layer on top of the same model that powers [[KALIMTU]]. Different brand, different audience, shared infra.

---

## Status

Identity locked 2026-05-30. Frontend build in progress. **No waitlist** — shipping the real working flow on day one because the model is ready.

---

## Positioning

> For Tunisian creators, podcasters and journalists who need subtitles and transcripts that actually understand Darija, **Captih** is the first SRT tool built on Tunisia's largest dialect dataset. Unlike Otter, Descript or YouTube auto-captions, we don't hallucinate Tunisian — we were trained on 93 hours of it.

---

## Brand pillars

1. **Speaks your dialect** — fine-tuned, not translated
2. **SRT-first** — built for video timelines, not just text
3. **Built in Tunisia** — by a builder, not a corporation
4. **Pro quality, Tunisian price** — Descript output at DT pricing

---

## Audience ladder

1. **Tunisian podcasters** *(primary — they suffer the most today)*
2. Tunisian YouTubers / TikTok creators
3. Tunisian journalists, radio shows, documentary makers
4. Tunisian companies (meeting transcripts, training content)
5. *Future:* MENA creators (Egyptian, Levantine dialects)

---

## Visual identity — "Studio Night"

### Palette

| Token | Hex | Use |
|---|---|---|
| `ink` | `#0B0B0F` | Background |
| `surface` | `#16161C` | Cards, panels |
| `line` | `#1E1E26` | Borders, dividers |
| `bone` | `#F4F1EA` | Primary text (parchment off-white) |
| `mute` | `#8A857C` | Body / secondary text |
| `signal` | `#FF5C2B` | Accent — CTAs, waveforms, hover (electric saffron) |
| `ok` | `#7CE2B1` | Success / completed transcript |

**Rationale:** dark-mode-native (creator-pro signal), warm parchment instead of cold white, one sharp saffron accent that reads Tunisian-warm without being flag-cliché.

### Typography

| Role | Font | Why |
|---|---|---|
| Display | **Inter Tight** | Sharp, tight, creator-tool standard, free |
| Body | **Inter** | Neutral, A+ legibility, free |
| Mono | **JetBrains Mono** | Timestamps, SRT preview, code, free |
| Arabic | **IBM Plex Sans Arabic** | Pro-grade Arabic sibling to Inter, free |

**Logo treatment is always lowercase:** `captih` — never "Captih" in branded surfaces. Lowercase = creator-tool, uppercase = enterprise.

### Logo direction

Lead idea: a stylized **"c" as a sound bracket / wave-catcher** with a single dot inside — the captured sound.

```
   (·    captih
```

Optional treatment: the **"i" dot** doubles as a microphone capture point.
Alt direction: pure wordmark with the **"t"** carrying a horizontal underline — a subtitle line.

No mascot, no character, no gradient. Wordmark + minimal mark only.

### Motion language

- Spring/lerp easing — never bouncy
- Hero motion: waveform resolves into a single subtitle line
- Loading state: cursor blinking inside an SRT timestamp `00:00:12,400 --> 00:00:|`

---

## Voice & tone

- **Direct. No fluff.** ("Drop the file. Get the SRT. Done.")
- **Confident about the moat, never bragging.** ("Trained on 93 hours of real Tunisian.")
- **One bilingual line per page** — cultural signal, not gimmick. ("نحكي بالتونسي. We get it.")
- **Never apologetic. Never enterprise-corporate.**
- **Show the artifact:** real timestamps, real waveforms, real Tunisian sentences in hero shots.
- **Use the verb.** "Captih it." is the brand command — like "Google it", "Slack me", "Loom it."

**Words we use:** drop, ship, real, dialect, exact, fast, built, line, voice, catch, captih
**Words we don't:** leverage, solution, enterprise, revolutionize, unleash

---

## Pricing positioning *(numbers TBD, framing locked)*

| Plan | Frame | Target |
|---|---|---|
| **Free** | "Try it on one real episode." | 30 min/month |
| **Creator** | "Built for the weekly podcaster." | ~25 DT/mo |
| **Studio** | "For podcast networks & agencies." | ~75 DT/mo |

Frame: **"Built in Tunisia. Priced for Tunisia. Quality for the world."**

---

## Relationship to other brands

- **Captih is a product under the [[BRAND|faruk_automates]] founder brand.** Founder story is a marketing asset, not a footnote. Every milestone ships on IG.
- **Captih vs [[KALIMTU]]:** Kalimtu = consumer Tunisian dictation. Captih = pro creator SRT tool. Different products, different sites, same underlying FARUKxAUTO model. Cross-link in footers.
- **Public-build energy** — Captih is built in the open.

---

## Differentiator vs the market

| | Otter / Descript / Rev | YouTube auto-captions | **Captih** |
|---|---|---|---|
| Tunisian dialect | Broken / nonsense | Broken / nonsense | **Native, trained** |
| SRT export | Yes (paid tiers) | Limited | **Yes, first-class** |
| Built by | US/global team | Google | **Tunisian builder** |
| Trained on | Generic Arabic if any | Generic Arabic if any | **93h Tunisian** |
| Price | $15–30/mo USD | Free but unusable for Darija | **~25 DT/mo** |

---

## Core user journey

1. User lands on captih.* (domain: `captih.com` lead, `captih.ai` / `captih.app` as fallbacks)
2. Drops a video (MP4, MOV) or audio (MP3, WAV)
3. System extracts audio if needed → sends to FARUKxAUTO
4. Returns: formatted SRT file + raw transcript + word-level timestamps
5. User previews, edits inline if needed, downloads

---

## Technical stack

| Component | Plan |
|---|---|
| Frontend | Next.js (App Router) + Tailwind + TypeScript |
| Processing | Queue-based — upload → job → polling |
| Model | FARUKxAUTO via HuggingFace Inference (MVP) → self-hosted later |
| Storage | Temp storage for uploads, output delivered on completion |
| Auth | None for MVP (anonymous use) → magic link when free-tier limits go live |

---

## Domain plan

Priority order:
1. **`captih.com`** — preferred, available
2. `captih.ai` — premium positioning fallback
3. `captih.app` — creator-tool fallback

All three reported available by user. Buy `captih.com` first.

---

## Open questions

- Self-host the FARUKxAUTO model from start, or use HuggingFace Inference API for MVP?
- Inline editor in v1 or download-only?

---

## Next actions

1. ✅ Lock identity (this file)
2. ✅ Lock name as Captih
3. Buy `captih.com`
4. Build frontend (in progress)
5. Wire FARUKxAUTO model endpoint
6. Get 5 real Tunisian podcasters to use it before public launch
