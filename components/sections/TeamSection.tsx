import type { TeamGroup } from '@/data/content';

export interface TeamSectionProps {
  team: readonly TeamGroup[];
}

/**
 * TeamSection renders the student leadership and coordination committees.
 */
export function TeamSection({ team }: TeamSectionProps) {
  return (
    <section id="team" className="site-section team-section" aria-label="DigiWeek organizing team">
      <div className="section-index">03</div>
      <div className="section-label">THE PEOPLE</div>

      <div className="team-intro">
        <h2>
          Built by
          <br />
          <span>students.</span>
        </h2>
      </div>

      <figure className="team-photo">
        <img
          src="/assets/real/techttonic-group.webp"
          alt="Organizing team at a previous technology event"
          loading="lazy"
          decoding="async"
        />
      </figure>

      <div className="team-grid">
        {team.map((group) => (
          <div className="team-column" key={group.group}>
            <div className="team-group-title">{group.group}</div>
            <div className="team-names">
              {group.names.map((name, index) => (
                <div className="team-name" key={name}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{name}</strong>
                  <i>↗</i>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
