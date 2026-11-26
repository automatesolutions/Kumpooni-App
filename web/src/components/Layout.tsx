import React from 'react'
import {Link, NavLink, Outlet, ScrollRestoration, useLocation} from 'react-router-dom'
import {Building, CircleCheck, CircleUser, Folder, Home, Info, Store} from '@/components/icons'
import {useSession} from '@/state/session'
import {useUiStore} from '@/stores/ui'

/** Same five places on phone and desktop. History is inside Repairs, and Ask lives on a file. */
const NAV = [
  {to: '/', label: 'Home', icon: Home, end: true},
  {to: '/files', label: 'Repairs', icon: Folder},
  {to: '/nearby', label: 'Top shops', icon: Store, isNew: true},
  {to: '/offices', label: 'DTI offices', icon: Building},
  {to: '/account', label: 'Account', icon: CircleUser},
]

const SEEN_NEARBY = 'kumpooni.seen-nearby'

/**
 * True until the person opens /nearby once on this device, so the "New" badge
 * points people to the page and then gets out of the way.
 */
function useShowNewBadge() {
  const {pathname} = useLocation()
  const [seen, setSeen] = React.useState(() => {
    try {
      return localStorage.getItem(SEEN_NEARBY) === '1'
    } catch {
      return false
    }
  })
  React.useEffect(() => {
    if (seen || !pathname.startsWith('/nearby')) return
    setSeen(true)
    try {
      localStorage.setItem(SEEN_NEARBY, '1')
    } catch {
      // Private mode: the badge comes back next visit. That's fine.
    }
  }, [pathname, seen])
  return !seen
}

function NewBadge() {
  return <span className="nav-new">New</span>
}

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
  const email = session?.user.email ?? ''
  const avatar: string | undefined = session?.user.user_metadata.avatar_url
  const showNew = useShowNewBadge()

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
              {item.isNew && showNew && <NewBadge />}
            </NavLink>
          ))}
        </nav>

        <div className="header__actions">
          {session && !isGuest ? (
            <Link to="/account" className="user-chip" aria-label={`Signed in as ${email}. Open your account.`}>
              {avatar ? (
                <img src={avatar} alt="" width={28} height={28} referrerPolicy="no-referrer" />
              ) : (
                <span className="user-chip__initial" aria-hidden>
                  {(email[0] ?? 'K').toUpperCase()}
                </span>
              )}
              <span className="user-chip__email">{email}</span>
            </Link>
          ) : (
            <Link to="/login" className="btn btn--secondary btn--sm">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

function TabBar() {
  const showNew = useShowNewBadge()
  return (
    <nav className="tabbar" aria-label="Main">
      {NAV.map(({to, label, icon: Icon, end, isNew}) => (
        <NavLink key={to} to={to} end={end}>
          <span className="tabbar__icon">
            <Icon size={22} aria-hidden />
            {isNew && showNew && <NewBadge />}
          </span>
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
        <nav aria-label="Footer">
          <Link to="/about">About</Link>
          <Link to="/terms">Terms &amp; conditions</Link>
          <Link to="/privacy">Privacy</Link>
          <a href="mailto:appdev@automatesolutionsinc.com">Contact</a>
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
