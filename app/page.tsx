'use client';

import { useEffect, useState } from 'react';
import Experience from '@/components/Experience';
import { MenuLayer } from '@/components/navigation/MenuLayer';
import { SiteHeader } from '@/components/navigation/SiteHeader';
import { AboutSection } from '@/components/sections/AboutSection';
import { ContactSection } from '@/components/sections/ContactSection';
import { EventsSection } from '@/components/sections/EventsSection';
import { SponsorsSection } from '@/components/sections/SponsorsSection';
import { TeamSection } from '@/components/sections/TeamSection';
import { CustomCursor } from '@/components/ui/CustomCursor';
import { events, navItems, socials, sponsors, team, type NavItem } from '@/data/content';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const scrollToSection = (sectionId: NavItem['sectionId']) => {
    setMenuOpen(false);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main id="top">
      <SiteHeader onOpenMenu={() => setMenuOpen(true)} />
      <CustomCursor />
      <Experience />
      <AboutSection />
      <EventsSection events={events} />
      <TeamSection team={team} />
      <SponsorsSection sponsors={sponsors} />
      <ContactSection socials={socials} />

      {menuOpen && (
        <MenuLayer
          items={navItems}
          socials={socials}
          onClose={() => setMenuOpen(false)}
          onNavigate={scrollToSection}
        />
      )}
    </main>
  );
}
