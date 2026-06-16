import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms — Captih",
  description:
    "Terms of service for Captih, a Tunisian-dialect transcription tool. Plain English, fair use.",
};

const LAST_UPDATED = "May 31, 2026";

export default function TermsPage() {
  return (
    <>
      <header>
        <p className="font-mono text-xs uppercase tracking-wider text-signal">
          Legal
        </p>
        <h1 className="mt-3 font-display text-4xl font-medium tracking-tight text-bone sm:text-5xl">
          Terms of service
        </h1>
        <p className="mt-3 font-mono text-xs text-mute">
          v1.0 · Last updated {LAST_UPDATED}
        </p>
      </header>

      <Section title="The short version">
        <p>
          By using Captih, you agree to these terms. We provide a transcription
          service for Tunisian dialect audio. You pay per use. Be honest about
          what you upload. We&apos;ll deliver a working service or refund you.
        </p>
      </Section>

      <Section title="1. Who you are agreeing with">
        <p>
          &quot;Captih&quot;, &quot;we&quot;, &quot;us&quot; refers to the service
          operated by Faruk, a sole proprietor based in Tunisia. &quot;You&quot;
          means the person creating an account and using the service.
        </p>
        <p>
          You must be at least 13 years old to use Captih. If you&apos;re
          between 13 and 18, you confirm a parent or guardian agrees to these terms
          on your behalf.
        </p>
      </Section>

      <Section title="2. Your account">
        <ul className="ml-5 list-disc space-y-1 text-mute">
          <li>One account per person. Don&apos;t share login credentials.</li>
          <li>Don&apos;t create multiple accounts to abuse the free trial.</li>
          <li>You&apos;re responsible for everything done with your account.</li>
          <li>Keep your email address current — that&apos;s how we reach you.</li>
        </ul>
      </Section>

      <Section title="3. What you can upload">
        <p>
          You can upload audio or video files containing speech, generally
          Tunisian dialect (the model also handles French/Arabic code-switching
          common in Tunisia). You must own the rights to what you upload OR have
          permission from the rights-holder.
        </p>
        <p className="font-medium text-bone">Don&apos;t upload:</p>
        <ul className="ml-5 list-disc space-y-1 text-mute">
          <li>
            Content that violates someone&apos;s privacy (e.g., recordings of
            people who didn&apos;t consent to be recorded)
          </li>
          <li>Illegal content of any kind</li>
          <li>Malware, viruses, or files designed to harm our infrastructure</li>
          <li>Content depicting CSAM, sexual violence, or graphic abuse</li>
          <li>Content that infringes someone else&apos;s copyright or trademark</li>
        </ul>
        <p className="text-mute">
          We don&apos;t pre-screen uploads, but we may suspend or terminate
          accounts found to be uploading prohibited content. We may report
          serious violations (e.g., CSAM) to authorities as required by law.
        </p>
      </Section>

      <Section title="4. What you own">
        <p>
          <span className="text-bone">You own your uploads.</span> You own the
          transcripts and edits we generate from your uploads.
        </p>
        <p>
          You grant us a temporary, limited license to your audio for the sole
          purpose of running it through our transcription model. That license
          ends when the audio file is deleted (within 24 hours). We never train
          AI models on your content.
        </p>
      </Section>

      <Section title="5. Pricing, payments, and refunds">
        <h3 className="font-display text-lg font-medium text-bone">How pricing works</h3>
        <ul className="ml-5 list-disc space-y-1 text-mute">
          <li>
            <span className="text-bone">Free trial:</span> 3 minutes per account,
            one-time
          </li>
          <li>
            <span className="text-bone">Packs:</span> one-time purchase, minutes
            never expire
          </li>
          <li>
            <span className="text-bone">Custom hours:</span> one-time purchase,
            minutes expire 30 days after purchase
          </li>
        </ul>

        <h3 className="mt-4 font-display text-lg font-medium text-bone">Payment</h3>
        <p className="text-mute">
          All payments go through Dhmad.tn. We accept Tunisian dinar (DT) via
          their supported methods. By paying, you agree to Dhmad.tn&apos;s own
          terms.
        </p>

        <h3 className="mt-4 font-display text-lg font-medium text-bone">Refunds</h3>
        <p className="text-mute">
          We refund in full if our service fails to deliver — for example, if
          the model fails to transcribe and we can&apos;t fix it. Email{" "}
          <a
            href="mailto:hello@captih.com"
            className="link-metis text-bone"
          >
            hello@captih.com
          </a>{" "}
          within 14 days of the failed transcription. We don&apos;t refund unused
          minutes from packs (since packs don&apos;t expire — just use them
          later).
        </p>
      </Section>

      <Section title="6. Service availability">
        <p className="text-mute">
          We aim to keep Captih running 24/7 but we can&apos;t guarantee zero
          downtime. We may need to take the service offline for maintenance,
          model updates, or in response to incidents. If we have a planned
          outage, we&apos;ll announce it in advance.
        </p>
      </Section>

      <Section title="7. Accuracy disclaimer">
        <p className="text-mute">
          The CAPTIH engine is the best Tunisian dialect transcription model we
          know of, but it is not 100% accurate. Use our inline editor to fix any
          errors before you publish or rely on the transcript. We are not
          liable for decisions you make based on automatically-generated
          transcripts.
        </p>
      </Section>

      <Section title="8. Termination">
        <p className="text-mute">
          You can close your account at any time from your dashboard. We&apos;ll
          delete your data per the schedule in our{" "}
          <a href="/legal/privacy" className="link-metis text-bone">
            privacy policy
          </a>
          .
        </p>
        <p className="text-mute">
          We may suspend or terminate your account if you violate these terms,
          abuse the service, or attempt to defraud us. We&apos;ll usually warn
          you first unless the violation is severe.
        </p>
      </Section>

      <Section title="9. Limitation of liability">
        <p className="text-mute">
          To the maximum extent permitted by law, our total liability to you for
          any claim arising from your use of Captih is limited to the amount
          you&apos;ve paid us in the 12 months before the claim. We are not
          liable for indirect, consequential, or punitive damages. This service
          is provided &quot;as is&quot; without warranties beyond what
          we&apos;ve explicitly promised here.
        </p>
      </Section>

      <Section title="10. Governing law">
        <p className="text-mute">
          These terms are governed by Tunisian law. Any dispute will be resolved
          in the competent courts of Mahdia, Tunisia. If you&apos;re an EU
          consumer, you keep the protections of your local consumer law.
        </p>
      </Section>

      <Section title="11. Changes to these terms">
        <p className="text-mute">
          We&apos;ll update these terms when needed. Significant changes will be
          announced by email at least 30 days in advance. By continuing to use
          Captih after a change, you accept the new terms. If you disagree, you
          can close your account before the change takes effect.
        </p>
      </Section>

      <Section title="12. Contact">
        <p className="text-mute">
          Questions about these terms? Email{" "}
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
