import React from 'react'
import {Player} from '@lordicon/react'
import {MQ, ScrollTrigger} from '@/lib/gsap'

type Props = {
  /** Lordicon JSON, imported from src/assets/lordicon. */
  icon: object
  /** Intro state from the icon's markers, such as 'in-calendar'. */
  state?: string
  size?: number
}

/**
 * Plays a Lordicon animation once, the first time it scrolls into view.
 * Colours come from the design tokens (--ink outline, --brand accent), so the icon
 * follows light and dark mode. With reduced motion it shows the last frame only.
 *
 * Licence: Lordicon free icons are CC BY-ND 4.0. Keep the credit link in the footer
 * and on the About page.
 */
export default function LordIcon({icon, state, size = 56}: Props) {
  const wrap = React.useRef<HTMLSpanElement>(null)
  const player = React.useRef<Player>(null)
  const trigger = React.useRef<ScrollTrigger>()
  const [colors, setColors] = React.useState<string>()

  React.useEffect(() => () => trigger.current?.kill(), [])

  React.useLayoutEffect(() => {
    const css = getComputedStyle(document.documentElement)
    const ink = css.getPropertyValue('--ink').trim()
    const brand = css.getPropertyValue('--brand').trim()
    setColors(`primary:${ink},secondary:${brand}`)
  }, [])

  const onReady = () => {
    const p = player.current
    if (!p || !wrap.current) return
    if (!matchMedia(MQ.motion).matches) {
      p.goToLastFrame()
      return
    }
    p.goToFirstFrame()
    trigger.current?.kill()
    trigger.current = ScrollTrigger.create({
      trigger: wrap.current,
      start: 'top 85%',
      once: true,
      onEnter: () => p.playFromBeginning(),
    })
  }

  return (
    <span ref={wrap} className="lordicon" aria-hidden style={{width: size, height: size}}>
      {colors && <Player ref={player} icon={icon} size={size} state={state} colors={colors} onReady={onReady} />}
    </span>
  )
}
