import {Link, NavLink, Outlet, ScrollRestoration} from 'react-router-dom'
import {Building, CircleCheck, CircleUser, Folder, Home, Info} from '@/components/icons'
import {useSession} from '@/state/session'
import {useUiStore} from '@/stores/ui'

/** Same four places on phone and desktop. History is inside Repairs, and Ask lives on a file. */
const NAV = [
  {to: '/', label: 'Home', icon: Home, end: true},
  {to: '/files', label: 'Repairs', icon: Folder},
  {to: '/offices', label: 'DTI offices', icon: Building},
  {to: '/account', label: 'Account', icon: CircleUser},
]

export function Layout() {
  return (
    <div className="shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      {/* ScrollSmoother hooks onto these two on pages that turn it on (see useSmoothScroll).
          Fixed and sticky UI stays outside, because the smoothed content moves with a transform. */}
      <div id="smooth-wrapper" className="smooth-wrapper">
        <div id="smooth-content" className="smooth-content">
          <main id="main" className="main">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
      <TabBar />
      <Toasts />
      <ScrollRestoration />
    </div>
  )
}

function Header() {
  const {session, isGuest} = useSession()

  return (
    <header className="header">
      <div className="container header__inner">
        <Link to="/" className="brand" aria-label="Kumpooni home">
          <img src="/images/mascot-round.png" alt="" width={34} height={34} />
          <span>Kumpooni</span>
        </Link>

        <nav className="nav" aria-label="Main">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="header__actions">
          {!session ? (
            <Link to="/files/new" className="btn btn--secondary btn--sm">
              Try the app
            </Link>
          ) : isGuest ? (
            <Link to="/account" className="trying-pill" aria-label="Trying it. Open your account.">
              <span className="trying-pill__dot" aria-hidden />
              Trying it
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  )
}

function TabBar() {
  return (
    <nav className="tabbar" aria-label="Main">
      {NAV.map(({to, label, icon: Icon, end}) => (
        <NavLink key={to} to={to} end={end}>
          <Icon size={22} aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <span>© {new Date().getFullYear()} Auto-Mate Solutions Inc.</span>
        <nav aria-label="Footer">
          <Link to="/about">About</Link>
          <Link to="/terms">Terms &amp; conditions</Link>
          <a href="mailto:appdev@automatesolutionsinc.com">Contact</a>
          {/* Required by the Lordicon free licence (CC BY-ND 4.0). */}
          <a href="https://lordicon.com/" target="_blank" rel="noreferrer">
            Animated icons by Lordicon
          </a>
        </nav>
      </div>
    </footer>
  )
}

function Toasts() {
  const toasts = useUiStore(s => s.toasts)
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className="toast">
          {t.tone === 'success' ? <CircleCheck size={18} aria-hidden /> : <Info size={18} aria-hidden />}
          {t.message}
        </div>
      ))}
    </div>
  )
}
