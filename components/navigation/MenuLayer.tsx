import type { NavItem, SocialLinks } from '@/data/content';

type MenuLayerProps = {
  items: NavItem[];
  socials: SocialLinks;
  onClose: () => void;
  onNavigate: (sectionId: NavItem['sectionId']) => void;
};

export function MenuLayer({ items, socials, onClose, onNavigate }: MenuLayerProps) {
  return (
    <div className="menu-layer" role="dialog" aria-modal="true" aria-label="Site navigation">
      <div className="menu-top">
        <span>DIGIWEEK &apos;26</span>
        <button onClick={onClose} aria-label="Close menu">CLOSE x</button>
      </div>
      <div className="menu-links">
        {items.map((item, index) => (
          <button key={item.sectionId} onClick={() => onNavigate(item.sectionId)}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            {item.label}
            <i>↗</i>
          </button>
        ))}
      </div>
      <div className="menu-bottom">
        <a href={socials.instagram} target="_blank" rel="noreferrer">INSTAGRAM ↗</a>
        <a href={socials.whatsapp} target="_blank" rel="noreferrer">WHATSAPP ↗</a>
      </div>
    </div>
  );
}
