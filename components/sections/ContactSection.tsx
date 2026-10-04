import type { SocialLinks } from '@/data/content';

export interface ContactSectionProps {
  socials: SocialLinks;
}

/**
 * ContactSection renders contact channels, verified official social links,
 * and institutional partner logos.
 */
export function ContactSection({ socials }: ContactSectionProps) {
  return (
    <section id="contact" className="site-section contact-section" aria-label="Contact and community links">
      <div className="section-index">05</div>
      <div className="section-label">CONTACT</div>

      <div className="contact-layout">
        <div>
          <h2>
            Stay
            <br />
            <span>close.</span>
          </h2>
          <p>Updates, announcements and the next chapter.</p>
        </div>

        <div className="contact-list">
          <a href={`tel:${socials.phone}`}>
            <small>CALL</small>
            <strong>{socials.phone}</strong>
          </a>
          <a href={socials.instagram} target="_blank" rel="noopener noreferrer">
            <small>INSTAGRAM</small>
            <strong>@ucc_digitalaffairscell ↗</strong>
          </a>
          <a href={socials.whatsapp} target="_blank" rel="noopener noreferrer">
            <small>WHATSAPP COMMUNITY</small>
            <strong>Join the community ↗</strong>
          </a>
        </div>
      </div>

      <footer className="site-footer">
        <div className="institutional-lockup">
          <img
            src="/assets/brand/ucc-logo.png"
            alt="UCC & DA Logo"
            loading="lazy"
            decoding="async"
          />
          <img
            src="/assets/brand/university-logo.png"
            alt="J.C. Bose University YMCA Logo"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="footer-meta">
          <span>DIGIWEEK &apos;26</span>
          <span>J.C. BOSE UNIVERSITY · FARIDABAD</span>
        </div>
      </footer>
    </section>
  );
}
