export interface SiteHeaderProps {
  onOpenMenu: () => void;
}

/**
 * Minimal site header with DigiWeek '26 wordmark on the left
 * and navigation menu trigger on the right.
 */
export function SiteHeader({ onOpenMenu }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <a className="wordmark" href="#top" aria-label="DigiWeek home">
        <span>DIGIWEEK</span>
        <b>&apos;26</b>
      </a>

      <div className="header-right">
        <button className="menu-trigger" onClick={onOpenMenu} aria-label="Open menu">
          MENU <i />
        </button>
      </div>
    </header>
  );
}
