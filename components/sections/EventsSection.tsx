import type { EventRecord } from '@/data/content';

export interface EventsSectionProps {
  events: readonly EventRecord[];
}

/**
 * EventsSection renders scheduled event programming or a designated
 * "Coming Soon" locked milestone panel when lineup is under wraps.
 */
export function EventsSection({ events }: EventsSectionProps) {
  return (
    <section id="events" className="site-section events-section" aria-label="Event programming">
      <div className="section-index">02</div>
      <div className="section-label">EVENTS</div>

      <div className="events-layout">
        <div>
          <h2>
            WHAT&apos;S
            <br />
            <span>NEXT?</span>
          </h2>
        </div>

        {events.length === 0 ? (
          <div className="locked-panel">
            <div className="locked-mark" aria-hidden="true">+</div>
            <div>
              <small>NOT ANNOUNCED</small>
              <h3>EVENTS COMING SOON</h3>
              <p>We are keeping the lineup under wraps for now.</p>
            </div>
          </div>
        ) : (
          <div className="events-list">
            {events.map((event) => (
              <article key={event.title}>
                <h3>{event.title}</h3>
                <p>{event.description}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
