import type { TeamGroup } from '@/data/content';

type TeamSectionProps = {
  team: TeamGroup[];
};

export function TeamSection({ team }: TeamSectionProps) {
  return (
    <section id="team" className="site-section team-section">
      <div className="section-index">03</div>
      <div className="section-label">THE PEOPLE</div>
      <div className="team-intro">
        <h2>Built by<br /><span>students.</span></h2>
      </div>
      <figure className="team-photo">
        <img src="/assets/real/techttonic-group.jpg" alt="Students attending a previous technology event" />
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
