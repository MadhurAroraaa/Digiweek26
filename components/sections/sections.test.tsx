import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AboutSection } from './AboutSection';
import { ContactSection } from './ContactSection';
import { EventsSection } from './EventsSection';
import { SponsorsSection } from './SponsorsSection';
import { TeamSection } from './TeamSection';
import { SiteHeader } from '@/components/navigation/SiteHeader';
import { MenuLayer } from '@/components/navigation/MenuLayer';
import { events, navItems, socials, sponsors, team } from '@/data/content';

describe('public sections & navigation', () => {
  it('renders about section with headings and legacy archive', () => {
    render(<AboutSection />);
    expect(screen.getByRole('heading', { level: 2, name: /ideas take form/i })).toBeInTheDocument();
    expect(screen.getByText(/J.C. Bose University/i)).toBeInTheDocument();
  });

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

  it('triggers menu callback on SiteHeader click', () => {
    const onOpenMenu = vi.fn();
    render(<SiteHeader onOpenMenu={onOpenMenu} />);
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    expect(onOpenMenu).toHaveBeenCalledOnce();
  });

  it('keeps SiteHeader minimal with wordmark and menu trigger', () => {
    render(<SiteHeader onOpenMenu={vi.fn()} />);
    expect(screen.getByRole('link', { name: /digiweek home/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
    expect(screen.queryByAltText(/UCC & DA Logo/i)).not.toBeInTheDocument();
  });

  it('navigates to sections and closes menu via button and Escape key', () => {
    const onClose = vi.fn();
    const onNavigate = vi.fn();
    const { unmount } = render(
      <MenuLayer items={navItems} socials={socials} onClose={onClose} onNavigate={onNavigate} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /events/i }));
    expect(onNavigate).toHaveBeenCalledWith('events');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();

    unmount();
  });
});
