import { motion } from 'framer-motion';

const EFFECTIVE_DATE = 'November 13, 2026';

function Section({ title, children }) {
  return (
    <section className="mb-10">
      <p className="meta mb-3 opacity-60">{title}</p>
      <div className="max-w-2xl space-y-3 font-body text-sm font-light leading-relaxed text-ink-soft">
        {children}
      </div>
    </section>
  );
}

export default function Privacy() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
    >
      <div className="px-6 pb-12 pt-32 md:px-12">
        <p className="meta mb-4">Legal</p>
        <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-light leading-[0.95] tracking-[-0.03em]">
          Privacy <em className="italic">Policy</em>.
        </h1>
        <p className="meta mt-6 opacity-60">Effective {EFFECTIVE_DATE}</p>
      </div>

      <div className="px-6 pb-24 md:px-12">
        <p className="mb-12 max-w-2xl font-body text-base font-light leading-relaxed text-ink-soft">
          I take the information you share with me seriously — whether it&rsquo;s a quick question
          through my contact form or the details I need to plan your session. This page explains
          what I collect, how I use it, and the choices you have.
        </p>

        <Section title="Information I Collect">
          <p>Depending on how you interact with this site, I may collect:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Your name, email address, and phone number when you send a message, request a booking, or sign a contract.</li>
            <li>Session details you share with me — dates, locations, who&rsquo;s in the shoot, and any notes about your session.</li>
            <li>Guardian/contact information, participant names, and a model-release choice collected as part of signing a photography agreement.</li>
            <li>Your signature image when you sign a contract electronically.</li>
            <li>Testimonials or guest book entries you choose to submit for publication.</li>
          </ul>
        </Section>

        <Section title="How I Use Your Information">
          <p>I use the information above to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Respond to inquiries and schedule, confirm, and manage your session.</li>
            <li>Prepare and send photography agreements, and keep a record of signed contracts.</li>
            <li>Send you booking confirmations, reminders, and updates about your session by email or text.</li>
            <li>Deliver your finished photos.</li>
            <li>Publish testimonials or guest book messages you&rsquo;ve submitted, with your permission.</li>
          </ul>
          <p>I don&rsquo;t use your information for anything beyond running my photography business — no selling it, no third-party advertising lists.</p>
        </Section>

        <Section title="Text Message (SMS) Communications">
          <p>
            If you provide a phone number when booking a session or signing a contract, I may send
            you text messages related to that booking — confirmations, reminders, scheduling
            updates, and contract-related notices. Message and data rates may apply, and frequency
            depends on your booking activity.
          </p>
          <p>
            Your phone number is used only for these session-related messages. It is never sold,
            rented, or shared with third parties for marketing purposes. You can opt out of text
            messages at any time by replying <strong>STOP</strong>, or get help by replying{' '}
            <strong>HELP</strong>. You can also reach me directly through the{' '}
            <a href="/contact" className="link-draw">contact page</a> to update your preferences.
          </p>
        </Section>

        <Section title="How I Share Information">
          <p>
            I work with a small number of service providers to run this site and my business —
            for example, secure cloud storage for photos, email delivery for notifications, and
            payment-adjacent tools for deposits. These providers only receive the information they
            need to perform their service and aren&rsquo;t permitted to use it for their own
            purposes. I don&rsquo;t share your personal information with anyone else except where
            required by law.
          </p>
        </Section>

        <Section title="Data Security">
          <p>
            Photos and session data are stored with reputable cloud providers using encrypted
            connections. Contract signatures and personal details are stored securely and
            accessible only to me. No online system is 100% secure, but I take reasonable steps to
            protect your information.
          </p>
        </Section>

        <Section title="Cookies & Analytics">
          <p>
            This site doesn&rsquo;t use third-party advertising trackers or sell data to ad
            networks. It loads web fonts from Google Fonts, and if you have an admin account, a
            login token is stored locally in your browser so you stay signed in — that token never
            leaves your device.
          </p>
        </Section>

        <Section title="Children's Privacy">
          <p>
            I photograph families, including children — but this site itself isn&rsquo;t directed
            at children, and I don&rsquo;t knowingly collect personal information directly from
            children online. Information about minors included in a session (names, participant
            details) is provided by a parent or guardian as part of booking and signing the
            photography agreement.
          </p>
        </Section>

        <Section title="Your Choices">
          <p>
            You can ask me to access, correct, or delete the personal information I have about you
            at any time — just reach out through the contact page or reply to any email from me.
          </p>
        </Section>

        <Section title="Changes to This Policy">
          <p>
            I may update this policy occasionally as the site or my business practices change.
            The &ldquo;Effective&rdquo; date at the top will reflect the most recent revision.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about this policy or your information? Reach out through the{' '}
            <a href="/contact" className="link-draw">contact page</a>.
          </p>
        </Section>
      </div>
    </motion.div>
  );
}
