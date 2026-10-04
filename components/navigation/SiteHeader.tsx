type SiteHeaderProps = {
  onOpenMenu: () => void;
};

export function SiteHeader({ onOpenMenu }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <a className="wordmark" href="#top" aria-label="DigiWeek home">
        <span>DIGIWEEK</span>
        <b>&apos;26</b>
      </a>
      <div className="header-right">
        <span className="header-org">UCC &amp; DA</span>
        <button className="menu-trigger" onClick={onOpenMenu} aria-label="Open menu">
          MENU <i />
        </button>
      </div>
    </header>
  );
}
