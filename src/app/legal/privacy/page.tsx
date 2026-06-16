import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy — Captih",
  description:
    "How Captih collects, uses, and protects your data. Audio uploaded for transcription is deleted within 24 hours.",
};

const LAST_UPDATED = "May 31, 2026";

export default function PrivacyPage() {
  return (
    <>
      <header>
        <p className="font-mono text-xs uppercase tracking-wider text-signal">
          Legal
        </p>
        <h1 className="mt-3 font-display text-4xl font-medium tracking-tight text-bone sm:text-5xl">
          Privacy policy
        </h1>
        <p className="mt-3 font-mono text-xs text-mute">
          v1.0 · Last updated {LAST_UPDATED}
        </p>
      </header>

      <Section title="The short version">
        <p>
          We collect the minimum data we need to run Captih: your email (for
          account login), what you upload (to transcribe it), and how much you
          use the service (to bill correctly). We delete audio files within 24
          hours of processing. We don&apos;t train AI models on your content.
          We don&apos;t sell your data.
        </p>
      </Section>

      <Section title="Who we are">
        <p>
          Captih is a transcription service operated by Faruk (Tunisia), a sole
          proprietor. You can reach us at{" "}
          <a
            href="mailto:hello@captih.com"
            className="link-metis text-bone"
          >
            hello@captih.com
          </a>{" "}
          for any privacy question, data request, or complaint.
        </p>
      </Section>

      <Section title="What we collect">
        <h3 className="font-display text-lg font-medium text-bone">Account data</h3>
        <ul className="ml-5 list-disc space-y-1 text-mute">
          <li>Email address (required for sign-up)</li>
          <li>Display name and avatar (if you sign in with Google)</li>
          <li>Authentication tokens (managed by Clerk)</li>
        </ul>

        <h3 className="mt-4 font-display text-lg font-medium text-bone">
          Content you upload
        </h3>
        <ul className="ml-5 list-disc space-y-1 text-mute">
          <li>Audio and video files you submit for transcription</li>
          <li>The transcripts (text + timestamps) we generate from them</li>
          <li>Any edits you make in the inline editor</li>
        </ul>

        <h3 className="mt-4 font-display text-lg font-medium text-bone">
          Usage and billing data
        </h3>
        <ul className="ml-5 list-disc space-y-1 text-mute">
          <li>Minutes transcribed per file</li>
          <li>Credit balance and transaction history</li>
          <li>Payment metadata returned by Dhmad.tn (we do not store card numbers)</li>
        </ul>

        <h3 className="mt-4 font-display text-lg font-medium text-bone">
          Technical data
        </h3>
        <ul className="ml-5 list-disc space-y-1 text-mute">
          <li>IP address (rate limiting and abuse prevention)</li>
          <li>Browser type and approximate device info (anonymous product analytics)</li>
          <li>Error logs to fix bugs</li>
        </ul>
      </Section>

      <Section title="How we use it">
        <ul className="ml-5 list-disc space-y-1 text-mute">
          <li>
            <span className="text-bone">To deliver the service.</span> Audio
            goes to our transcription worker, comes back as text. Without this we
            can&apos;t do our job.
          </li>
          <li>
            <span className="text-bone">To bill you correctly.</span> Minutes
            used are tracked against your balance.
          </li>
          <li>
            <span className="text-bone">To improve the product.</span> Aggregate
            usage patterns (never linked to file content) help us decide what to
            build next.
          </li>
          <li>
            <span className="text-bone">To send important emails.</span> Receipts,
            password resets, service announcements. No marketing without your
            consent.
          </li>
        </ul>
        <p className="mt-3 text-mute">
          We <span className="text-bone">do not</span> use your audio,
          transcripts, or edits to train AI models — yours or anyone else&apos;s.
        </p>
      </Section>

      <Section title="How long we keep things">
        <ul className="ml-5 list-disc space-y-1 text-mute">
          <li>
            <span className="text-bone">Audio files:</span> deleted within 24
            hours after processing completes
          </li>
          <li>
            <span className="text-bone">Transcripts and edits:</span> kept for 90
            days, then automatically deleted
          </li>
          <li>
            <span className="text-bone">Account data:</span> kept while your
            account is active; deleted within 30 days of account closure
          </li>
          <li>
            <span className="text-bone">Billing records:</span> kept for 7 years
            (legal requirement for accounting in Tunisia)
          </li>
        </ul>
      </Section>

      <Section title="Third-party services">
        <p className="text-mute">
          We use the following providers. Each handles a specific job and has
          its own privacy policy that applies to the data we send them:
        </p>
        <ul className="ml-5 mt-2 list-disc space-y-1 text-mute">
          <li>
            <span className="text-bone">Clerk</span> — authentication
            (email, password, social sign-in)
          </li>
          <li>
            <span className="text-bone">Supabase</span> — database for your
            account, jobs, credits (hosted in Frankfurt, EU)
          </li>
          <li>
            <span className="text-bone">Cloudflare R2</span> — temporary audio
            file storage (deleted within 24 hours)
          </li>
          <li>
            <span className="text-bone">Modal</span> — runs the CAPTIH engine,
            our Tunisian dialect transcription model
          </li>
          <li>
            <span className="text-bone">Dhmad.tn</span> — payment processing
          </li>
          <li>
            <span className="text-bone">Resend</span> — transactional email
          </li>
          <li>
            <span className="text-bone">PostHog (EU)</span> — anonymous product
            analytics
          </li>
          <li>
            <span className="text-bone">Cloudflare</span> — DNS, CDN, and abuse
            prevention
          </li>
        </ul>
      </Section>

      <Section title="Your rights">
        <p className="text-mute">
          Under Tunisian law (Law n° 2004-63) and the EU GDPR (for EU residents),
          you have the right to:
        </p>
        <ul className="ml-5 mt-2 list-disc space-y-1 text-mute">
          <li>Access the data we hold about you</li>
          <li>Correct anything that&apos;s wrong</li>
          <li>Delete your account and all associated data</li>
          <li>Export your data in a machine-readable format</li>
          <li>Object to specific processing</li>
          <li>Lodge a complaint with the Tunisian data protection authority (INPDP)</li>
        </ul>
        <p className="mt-3 text-mute">
          Email{" "}
          <a
            href="mailto:hello@captih.com"
            className="link-metis text-bone"
          >
            hello@captih.com
          </a>{" "}
          to exercise any of these rights. We&apos;ll respond within 30 days.
        </p>
      </Section>

      <Section title="Security">
        <p className="text-mute">
          We use industry-standard practices: TLS encryption in transit, encrypted
          storage at rest, restricted access (only Faruk can see your data), and
          regular security review. No system is 100% secure, but we do what we
          can to keep your data safe.
        </p>
      </Section>

      <Section title="Cookies">
        <p className="text-mute">
          We use only essential cookies (authentication, CSRF protection). No
          third-party tracking cookies. No advertising cookies. PostHog
          analytics is cookie-less and IP-anonymized.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p className="text-mute">
          We&apos;ll update this page when our practices change. If the change is
          significant, we&apos;ll email you. The &quot;Last updated&quot; date at the top
          always reflects the latest version.
        </p>
      </Section>

      <Section title="Contact">
        <p className="text-mute">
          Questions? Concerns?{" "}
          <a
            href="mailto:hello@captih.com"
            className="link-metis text-bone"
          >
            hello@captih.com
          </a>
          .
        </p>
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-medium tracking-tight text-bone sm:text-2xl">
        {title}
      </h2>
      <div className="space-y-3 text-mute">{children}</div>
    </section>
  );
}
