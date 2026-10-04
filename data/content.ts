/**
 * Public content architecture for DigiWeek '26.
 *
 * All public-facing content is centralized here.
 * Future events, sponsors, and team coordinators can be added by updating
 * these exported data structures without modifying component rendering logic.
 */

export type SectionId = 'about' | 'events' | 'team' | 'sponsors' | 'contact';

export interface NavItem {
  label: string;
  sectionId: SectionId;
}

export interface TeamGroup {
  group: string;
  names: string[];
}

export interface EventRecord {
  title: string;
  description: string;
  date?: string;
  time?: string;
  venue?: string;
  registrationUrl?: string;
}

export interface SponsorRecord {
  name: string;
  logoSrc: string;
  url?: string;
  tier?: 'title' | 'associate' | 'partner';
}

export interface SocialLinks {
  instagram: string;
  whatsapp: string;
  phone: string;
}

export const navItems: readonly NavItem[] = [
  { label: 'About', sectionId: 'about' },
  { label: 'Events', sectionId: 'events' },
  { label: 'Team', sectionId: 'team' },
  { label: 'Sponsors', sectionId: 'sponsors' },
  { label: 'Contact', sectionId: 'contact' },
] as const;

export const team: readonly TeamGroup[] = [
  { group: 'Joint Secretaries', names: ['Madhur', 'Kritika', 'Karan', 'Yogita'] },
  { group: 'Senior Coordinators', names: ['Devansh', 'Kanika', 'Tarun'] },
  { group: 'Session Heads', names: ['Raghav', 'Pravit', 'Aastha', 'Nayan'] },
] as const;

/**
 * Public events array.
 * Intentionally empty during current "Coming Soon" teaser phase.
 */
export const events: readonly EventRecord[] = [];

/**
 * Public sponsors array.
 * Intentionally empty during current "Coming Soon" teaser phase.
 */
export const sponsors: readonly SponsorRecord[] = [];

/**
 * Official social and contact channels for UCC & DA.
 */
export const socials: SocialLinks = {
  instagram: 'https://www.instagram.com/ucc_digitalaffairscell/',
  whatsapp: 'https://chat.whatsapp.com/JD4FO66LH2PJNFqDJzggVG',
  phone: '7419190554',
};
