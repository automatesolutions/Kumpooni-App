import React from 'react'
import {ChevronRight, DesktopDown, Dots, PhoneDown, Share, SquarePlus, Tablet, X, type Icon} from '@/components/icons'
import {dismissInstall, promptInstall, useInstall, type InstallDevice} from '@/lib/install'
import {Button, Dialog} from './ui'

const COPY: Record<InstallDevice, {title: string; sub: string; icon: Icon}> = {
  phone: {title: 'Add Kumpooni to your phone', sub: 'Open it from your home screen, like an app.', icon: PhoneDown},
  tablet: {title: 'Add Kumpooni to your tablet', sub: 'Open it from your home screen, like an app.', icon: Tablet},
  computer: {title: 'Install Kumpooni', sub: 'Open it in its own window.', icon: DesktopDown},
}

/**
 * Adds Kumpooni to the home screen where the browser allows it: Chrome's or Edge's own
 * dialog, or the Share menu steps on iPhone and iPad. Hidden once installed. The Home
 * card can be closed for 14 days. The Account row stays, so people can still find it.
 */
export function InstallAppButton({variant}: {variant: 'card' | 'row'}) {
  const {how, device, dismissed} = useInstall()
  const [stepsOpen, setStepsOpen] = React.useState(false)
  if (!how || (variant === 'card' && dismissed)) return null

  const copy = COPY[device]
  const install = () => (how === 'prompt' ? void promptInstall() : setStepsOpen(true))
  const steps = <IosSteps open={stepsOpen} onClose={() => setStepsOpen(false)} />

  if (variant === 'row') {
    return (
      <ul className="card menu" style={{marginTop: 'var(--space-4)'}}>
        <li>
          <button type="button" onClick={install} aria-haspopup={how === 'ios' ? 'dialog' : undefined}>
            <copy.icon size={20} aria-hidden />
            <span>
              {copy.title}
              <small>{copy.sub}</small>
            </span>
            <ChevronRight size={18} className="chev" aria-hidden />
          </button>
          {steps}
        </li>
      </ul>
    )
  }

  return (
    <div className="card install-card">
      <button type="button" className="install-card__main" onClick={install} aria-haspopup={how === 'ios' ? 'dialog' : undefined}>
        <span className="install-card__icon" aria-hidden>
          <copy.icon size={24} />
        </span>
        <span>
          <span className="install-card__title">{copy.title}</span>
          <span className="install-card__sub">{copy.sub}</span>
        </span>
      </button>
      <button type="button" className="icon-btn" onClick={dismissInstall} aria-label="Not now">
        <X size={20} />
      </button>
      {steps}
    </div>
  )
}

function IosSteps({open, onClose}: {open: boolean; onClose: () => void}) {
  return (
    <Dialog open={open} onClose={onClose} title="Add Kumpooni to your home screen">
      <ol className="install-steps">
        <li>
          <span>
            Tap the Share button <Share size={20} role="img" aria-label="Share" className="install-steps__icon" />.
          </span>
          <span className="small muted" style={{display: 'block'}}>
            If you don't see it, tap <Dots size={18} role="img" aria-label="More" className="install-steps__icon" /> first.
          </span>
        </li>
        <li>
          Tap Add to Home Screen <SquarePlus size={20} aria-hidden className="install-steps__icon" />.
        </li>
        <li>Tap Add. Then open Kumpooni from your home screen.</li>
      </ol>
      <div className="dlg__foot">
        <Button onClick={onClose}>Got it</Button>
      </div>
    </Dialog>
  )
}
