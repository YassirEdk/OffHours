import { createFileRoute, Link } from "@tanstack/react-router";

/* /privacy — a plain, honest privacy notice. No trackers on the site, only
   the third-party APIs the generator has to hit (Supabase for auth, Groq for
   captions, FLUX/Together for images). This page states exactly what's kept,
   where, and how to remove it. */
export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — Offhours" },
      {
        name: "description",
        content:
          "What Offhours collects, where it goes, and how to remove it. No tracking, no analytics, no ads.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="legal-page">
      <article className="legal-body">
        <p className="mono-label">Legal · Privacy notice</p>
        <h1 className="display legal-title mt-4">Privacy</h1>
        <p className="body-copy mt-3 max-w-[62ch] opacity-80">
          Last updated: {new Date().toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <Section title="The short version">
          <p>
            Offhours does not run any analytics, advertising, or third-party trackers on this
            site. The only data leaving your browser is what the generator needs to work: the
            brief you type, and — if you sign in — your email and the settings you save.
          </p>
        </Section>

        <Section title="What we collect">
          <ul className="legal-list">
            <li>
              <strong>Account</strong> — your email address, a hashed password, and the name you
              enter at sign-up. Stored by Supabase (our auth provider) on your behalf.
            </li>
            <li>
              <strong>Brand settings</strong> — anything you save in Settings (profile photo,
              company logo, colours, style notes). Stored as user metadata on your Supabase
              auth record. Images are stored as data in that record, not as separate files.
            </li>
            <li>
              <strong>Briefs and generated packs</strong> — the brief you write is encoded into
              the URL when a pack is generated. We do not store it server-side; it lives in your
              browser tab and in whatever share links you choose to send.
            </li>
          </ul>
        </Section>

        <Section title="What we don't collect">
          <ul className="legal-list">
            <li>No cookies for advertising or analytics.</li>
            <li>No third-party trackers (no Google Analytics, no Meta Pixel, no ad networks).</li>
            <li>No location data.</li>
            <li>No behavioural profiling.</li>
          </ul>
        </Section>

        <Section title="Who your data is sent to">
          <ul className="legal-list">
            <li>
              <strong>Supabase</strong> — email, password (hashed), display name, and settings.
              Their privacy policy governs the storage of that data.
            </li>
            <li>
              <strong>Groq</strong> — the text of your brief is sent to their inference API to
              generate captions. Groq's policy applies to that transit.
            </li>
            <li>
              <strong>Together / FLUX</strong> — the image prompt derived from your brief is
              sent to their image API. No personal data is included in the prompt beyond what
              you type into the brief yourself.
            </li>
            <li>
              <strong>Vercel</strong> — hosts the site. Standard server access logs (IP,
              user-agent, request path) apply. We do not read or process them beyond what
              Vercel's own dashboard shows for uptime.
            </li>
          </ul>
        </Section>

        <Section title="How to remove your data">
          <p>
            Sign in, open <strong>Settings</strong>, and clear the fields you don't want kept
            — save to overwrite them. To delete the whole account, email us and we'll remove
            your Supabase record. Once removed it's gone; we don't keep backups of user data.
          </p>
        </Section>

        <Section title="Children">
          <p>
            Offhours is a business tool. It's not directed at children under 13, and we don't
            knowingly collect their information.
          </p>
        </Section>

        <Section title="Changes to this notice">
          <p>
            If we change what's on this page, we'll update the date at the top. Substantive
            changes — anything that widens what we collect or who it's shared with — will be
            flagged on the home page for at least two weeks before they take effect.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions or requests: <a href="mailto:hello@offhours.app" className="legal-link">hello@offhours.app</a>.
          </p>
        </Section>

        <p className="mt-12">
          <Link to="/" className="legal-link">← Back home</Link>
        </p>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="legal-section">
      <h2 className="display-cond legal-h2">{title}</h2>
      <div className="body-copy legal-prose">{children}</div>
    </section>
  );
}
