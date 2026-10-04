export type NavItem = {
  label: string;
  sectionId: 'about' | 'events' | 'team' | 'sponsors' | 'contact';
};

export type TeamGroup = {
  group: string;
  names: string[];
};

export type EventRecord = {
  title: string;
  description: string;
};

export type SponsorRecord = {
  name: string;
  logoSrc: string;
  url?: string;
};

export type SocialLinks = {
  instagram: string;
  whatsapp: string;
  phone: string;
};

export const navItems: NavItem[] = [
  { label: 'About', sectionId: 'about' },
  { label: 'Events', sectionId: 'events' },
  { label: 'Team', sectionId: 'team' },
  { label: 'Sponsors', sectionId: 'sponsors' },
  { label: 'Contact', sectionId: 'contact' },
];

export const team: TeamGroup[] = [
  { group: 'Joint Secretaries', names: ['Madhur', 'Kritika', 'Karan', 'Yogita'] },
  { group: 'Senior Coordinators', names: ['Devansh', 'Kanika', 'Tarun'] },
  { group: 'Session Heads', names: ['Raghav', 'Pravit', 'Aastha', 'Nayan'] },
];

export const events: EventRecord[] = [];

export const sponsors: SponsorRecord[] = [];

export const socials: SocialLinks = {
  instagram: 'https://www.instagram.com/ucc_digitalaffairscell/',
  whatsapp: 'https://chat.whatsapp.com/JD4FO66LH2PJNFqDJzggVG',
  phone: '7419190554',
};
