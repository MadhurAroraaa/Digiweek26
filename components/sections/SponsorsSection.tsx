import type { SponsorRecord } from '@/data/content';

export interface SponsorsSectionProps {
  sponsors: readonly SponsorRecord[];
}

/**
 * SponsorsSection displays confirmed partners or a minimal, architectural
 * "Coming Soon" status panel while partnerships are progressing.
 */
export function SponsorsSection({ sponsors }: SponsorsSectionProps) {
  return (
    <section id="sponsors" className="site-section sponsors-section" aria-label="Sponsors and partners">
      <div className="section-index">04</div>
      <div className="section-label">SPONSORS</div>

      <div className="sponsors-inner">
        {sponsors.length === 0 ? (
          <>
            <p>PARTNERSHIPS ARE IN PROGRESS.</p>
            <h2>
              COMING <span>SOON.</span>
            </h2>
            <div className="sponsor-line">
              <span />
            </div>
          </>
        ) : (
          <div className="sponsor-grid">
            {sponsors.map((sponsor) => (
              <a
                key={sponsor.name}
                href={sponsor.url ?? '#sponsors'}
                aria-label={sponsor.name}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src={sponsor.logoSrc} alt={sponsor.name} loading="lazy" decoding="async" />
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
