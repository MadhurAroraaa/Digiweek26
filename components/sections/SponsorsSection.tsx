import type { SponsorRecord } from '@/data/content';

type SponsorsSectionProps = {
  sponsors: SponsorRecord[];
};

export function SponsorsSection({ sponsors }: SponsorsSectionProps) {
  return (
    <section id="sponsors" className="site-section sponsors-section">
      <div className="section-index">04</div>
      <div className="section-label">SPONSORS</div>
      <div className="sponsors-inner">
        {sponsors.length === 0 ? (
          <>
            <p>PARTNERSHIPS ARE IN PROGRESS.</p>
            <h2>COMING <span>SOON.</span></h2>
            <div className="sponsor-line"><span /></div>
          </>
        ) : (
          <div className="sponsor-grid">
            {sponsors.map((sponsor) => (
              <a key={sponsor.name} href={sponsor.url ?? '#sponsors'} aria-label={sponsor.name}>
                <img src={sponsor.logoSrc} alt="" />
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
