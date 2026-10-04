export interface SiteHeaderProps {
  onOpenMenu: () => void;
}

/**
 * SiteHeader integrates DigiWeek '26 wordmark, official institutional
 * identities (UCC & DA and J.C. Bose University), and menu trigger
 * in a restrained, modern top bar.
 */
export function SiteHeader({ onOpenMenu }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <a className="wordmark" href="#top" aria-label="DigiWeek home">
        <span>DIGIWEEK</span>
        <b>&apos;26</b>
      </a>

      <div className="header-right">
        <div className="header-brand-lockup" aria-label="Conducted by UCC & DA, J.C. Bose University">
          <div className="header-brand-logos">
            <img
              src="/assets/brand/ucc-logo.png"
              alt="UCC & DA Logo"
              className="header-brand-logo header-logo-ucc"
              width={26}
              height={26}
            />
            <img
              src="/assets/brand/university-logo.png"
              alt="J.C. Bose University Logo"
              className="header-brand-logo header-logo-univ"
              width={26}
              height={26}
            />
          </div>
          <div className="header-brand-text">
            <span className="header-brand-org">UCC &amp; DA</span>
            <span className="header-brand-sep">·</span>
            <span className="header-brand-univ">J.C. BOSE UST, YMCA</span>
          </div>
        </div>

        <button className="menu-trigger" onClick={onOpenMenu} aria-label="Open menu">
          MENU <i />
        </button>
      </div>
    </header>
  );
}
