/**
 * Sample transcripts shown on /examples. These are realistic-looking Tunisian
 * darija lines covering 4 use cases that match Captih's primary audience.
 *
 * When Faruk has real audio samples he wants to publish, swap these in.
 */

export type ExampleSample = {
  readonly id: string;
  readonly title: string;
  readonly useCase: "Reel" | "Podcast" | "News" | "Conversation";
  readonly icon: "reel" | "podcast" | "news" | "convo";
  readonly filename: string;
  readonly durationSec: number;
  readonly description: string;
  readonly segments: ReadonlyArray<{
    readonly index: number;
    readonly start: string;
    readonly end: string;
    readonly text: string;
  }>;
};

export const EXAMPLE_SAMPLES: ReadonlyArray<ExampleSample> = [
  {
    id: "reel-coffee",
    title: "Morning Reel",
    useCase: "Reel",
    icon: "reel",
    filename: "morning_routine.mp4",
    durationSec: 38,
    description:
      "A typical 38-second Instagram Reel from a Tunis food creator. Casual darija, some French code-switching, background ambient noise.",
    segments: [
      { index: 1, start: "00:00:00,420", end: "00:00:02,800", text: "صباح الخير، اليوم باش نوريوكم" },
      { index: 2, start: "00:00:02,800", end: "00:00:05,640", text: "كيفاش نديرو القهوة الخفيفة في الدار" },
      { index: 3, start: "00:00:05,640", end: "00:00:09,120", text: "أوّل حاجة، نحبو الماء يكون ساخن أمّا مش يغلي." },
      { index: 4, start: "00:00:09,120", end: "00:00:13,200", text: "نزيدو ملعقة قهوة، ونحركو بالشويّة." },
      { index: 5, start: "00:00:13,200", end: "00:00:17,500", text: "C'est super simple, et le résultat est délicieux." },
      { index: 6, start: "00:00:17,500", end: "00:00:21,860", text: "إذا عجبكم الفيديو، خلّيوا like وما تنسوش الاشتراك." },
      { index: 7, start: "00:00:21,860", end: "00:00:25,200", text: "نلتقاو في الفيديو الجاي." },
      { index: 8, start: "00:00:25,200", end: "00:00:28,400", text: "يلا، باي باي." },
    ],
  },
  {
    id: "podcast-startup",
    title: "Podcast Intro",
    useCase: "Podcast",
    icon: "podcast",
    filename: "ep14_intro.mp3",
    durationSec: 52,
    description:
      "First minute of a Tunisian tech podcast on bootstrapping a SaaS. Two speakers, normal indoor recording.",
    segments: [
      { index: 1, start: "00:00:00,000", end: "00:00:03,440", text: "أهلا بيكم في الحلقة الأربعطاش متاع البودكاست." },
      { index: 2, start: "00:00:03,440", end: "00:00:07,800", text: "اليوم عندنا ضيف خاصّ، يحبّ يحكيلنا على رحلتو." },
      { index: 3, start: "00:00:07,800", end: "00:00:12,100", text: "كيفاش بدا مشروعو من الزيرو وكيفاش وصل لـ 100 عميل." },
      { index: 4, start: "00:00:12,100", end: "00:00:16,800", text: "أهلا بيك يا أحمد، مرحبا بيك في الحلقة." },
      { index: 5, start: "00:00:16,800", end: "00:00:20,400", text: "شكرا فلان، فرحان نكون معاكم اليوم." },
      { index: 6, start: "00:00:20,400", end: "00:00:25,640", text: "قبل ما نبداو، نحبّ نسأل سؤال بسيط:" },
      { index: 7, start: "00:00:25,640", end: "00:00:30,200", text: "علاش اخترت تبدأ مشروع في تونس بالذات؟" },
      { index: 8, start: "00:00:30,200", end: "00:00:35,500", text: "Bonne question. في الحقيقة، أنا كنت نخدم في فرنسا" },
      { index: 9, start: "00:00:35,500", end: "00:00:40,800", text: "أمّا حسّيت إلّي السوق التونسي محتاج حلول محلّية." },
      { index: 10, start: "00:00:40,800", end: "00:00:45,200", text: "وهكاكا، رجعت لتونس وبديت من الصفر." },
      { index: 11, start: "00:00:45,200", end: "00:00:48,400", text: "هذا الإيمان بالسوق هو اللي خلّاني نواصل." },
      { index: 12, start: "00:00:48,400", end: "00:00:52,000", text: "نسمعو أكثر بعد الفاصل القصير." },
    ],
  },
  {
    id: "news-clip",
    title: "News Bulletin",
    useCase: "News",
    icon: "news",
    filename: "bulletin_2026.wav",
    durationSec: 42,
    description:
      "Short news clip in formal Tunisian darija mixed with MSA. Tests Captih's ability to handle register-shifting.",
    segments: [
      { index: 1, start: "00:00:00,000", end: "00:00:04,800", text: "أهلا وسهلا بيكم في نشرة الأخبار." },
      { index: 2, start: "00:00:04,800", end: "00:00:09,200", text: "بدينا بأهم الأخبار الاقتصادية لهالنهار." },
      { index: 3, start: "00:00:09,200", end: "00:00:14,500", text: "البنك المركزي التونسي أعلن اليوم على قرارات جديدة" },
      { index: 4, start: "00:00:14,500", end: "00:00:18,800", text: "تخصّ سعر الفائدة الرئيسي." },
      { index: 5, start: "00:00:18,800", end: "00:00:24,200", text: "في حين بقى التضخم في حدود 6.8 بالمية" },
      { index: 6, start: "00:00:24,200", end: "00:00:28,640", text: "حسب آخر الإحصائيات الرسمية." },
      { index: 7, start: "00:00:28,640", end: "00:00:33,100", text: "في خبر تاني، قطاع السياحة سجّل نموّ ملحوظ" },
      { index: 8, start: "00:00:33,100", end: "00:00:38,200", text: "في الثلاثي الأوّل من السنة الحالية." },
      { index: 9, start: "00:00:38,200", end: "00:00:42,000", text: "تفاصيل أكثر بعد الفاصل." },
    ],
  },
  {
    id: "convo-casual",
    title: "Voice Note",
    useCase: "Conversation",
    icon: "convo",
    filename: "voice_note_friend.m4a",
    durationSec: 28,
    description:
      "Casual voice note between friends — fast speech, slang, overlapping background noise. The hardest case.",
    segments: [
      { index: 1, start: "00:00:00,000", end: "00:00:02,400", text: "آلو يا حبيبي، وينك؟" },
      { index: 2, start: "00:00:02,400", end: "00:00:05,800", text: "كنت نحاول نعيّط فيك من البكري." },
      { index: 3, start: "00:00:05,800", end: "00:00:09,200", text: "المهم، باهي، اسمعني." },
      { index: 4, start: "00:00:09,200", end: "00:00:13,600", text: "إذا فاضي غدوة العشية نتلاقاو في الكافي" },
      { index: 5, start: "00:00:13,600", end: "00:00:17,200", text: "اللي عند ساحة الباساج، عادي." },
      { index: 6, start: "00:00:17,200", end: "00:00:21,500", text: "عندي خبر يفرحك، أمّا باش نقولهولك face-to-face." },
      { index: 7, start: "00:00:21,500", end: "00:00:25,000", text: "كلّمني أوّل ما تسمع الفويس." },
      { index: 8, start: "00:00:25,000", end: "00:00:28,000", text: "يلا، نسمع منك. باي." },
    ],
  },
] as const;

export function getExampleById(id: string): ExampleSample | undefined {
  return EXAMPLE_SAMPLES.find((s) => s.id === id);
}
