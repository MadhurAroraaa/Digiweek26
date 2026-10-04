export function AboutSection() {
  return (
    <section id="about" className="site-section about-section">
      <div className="section-index">01</div>
      <div className="section-label">ABOUT DIGIWEEK</div>
      <div className="about-layout">
        <div>
          <h2>A week where<br /><span>ideas take form.</span></h2>
        </div>
        <div className="about-copy">
          <p className="large-copy">DigiWeek is a technology-focused student experience by UCC &amp; DA at J.C. Bose University of Science &amp; Technology, YMCA, Faridabad.</p>
          <p>Every edition gets its own world. The work behind it is always the same: students building, learning, creating and giving people something worth remembering.</p>
        </div>
      </div>
      <div className="about-media-grid">
        <figure className="media-card tall"><img src="/assets/real/legacy-activity.png" alt="J.C. Bose University campus road" /></figure>
        <figure className="media-card wide"><img src="/assets/real/techttonic-audience.jpg" alt="Students attending a previous technology event" /></figure>
      </div>
      <div className="media-caption"><span>FROM PREVIOUS EDITIONS</span><span>THE WORLD CHANGES. THE PEOPLE DON&apos;T.</span></div>
      <div className="legacy-strip">
        <div className="legacy-strip-copy">
          <span>PROVEN LEGACY</span>
          <h3>Every edition,<br /><em>a different world.</em></h3>
          <p>From earlier themed experiences to what comes next, DigiWeek keeps changing the stage without losing the people behind it.</p>
        </div>
        <figure className="legacy-strip-media"><img src="/assets/real/legacy-arch.png" alt="A previous DigiWeek themed entrance" /></figure>
      </div>
      <div className="memory-reel">
        <div className="memory-reel-copy">
          <span>RECENTLY / ON STAGE</span>
          <h3>The room.<br /><em>The energy.</em></h3>
        </div>
        <div className="memory-reel-media">
          <video autoPlay muted loop playsInline preload="metadata" poster="/assets/real/techttonic-audience.jpg" aria-label="Highlights from a previous UCC and DA technology event">
            <source src="/assets/video/ucc-story-muted.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    </section>
  );
}
