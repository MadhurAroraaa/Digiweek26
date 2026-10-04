import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ContactSection } from './ContactSection';
import { EventsSection } from './EventsSection';
import { SponsorsSection } from './SponsorsSection';
import { TeamSection } from './TeamSection';
import { events, socials, sponsors, team } from '@/data/content';

describe('public sections', () => {
  it('keeps events in Coming Soon state while no events are approved', () => {
    render(<EventsSection events={events} />);
    expect(screen.getByText('EVENTS COMING SOON')).toBeInTheDocument();
  });

  it('keeps sponsors in Coming Soon state while no sponsors are approved', () => {
    render(<SponsorsSection sponsors={sponsors} />);
    expect(screen.getByText('COMING')).toBeInTheDocument();
    expect(screen.getByText('SOON.')).toBeInTheDocument();
  });

  it('renders centralized team data', () => {
    render(<TeamSection team={team} />);
    expect(screen.getByText('Joint Secretaries')).toBeInTheDocument();
    expect(screen.getByText('Madhur')).toBeInTheDocument();
  });

  it('renders centralized contact and social links', () => {
    render(<ContactSection socials={socials} />);
    expect(screen.getByRole('link', { name: /instagram/i })).toHaveAttribute('href', socials.instagram);
    expect(screen.getByRole('link', { name: /whatsapp community/i })).toHaveAttribute('href', socials.whatsapp);
    expect(screen.getByRole('link', { name: /call/i })).toHaveAttribute('href', `tel:${socials.phone}`);
  });
});
