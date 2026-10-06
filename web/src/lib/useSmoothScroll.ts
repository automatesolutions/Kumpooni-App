import {gsap, MQ, ScrollSmoother, useGSAP} from '@/lib/gsap'

/**
 * Turns on GSAP ScrollSmoother while the calling page is mounted.
 *
 * Only for showcase pages without sticky UI inside the content (the home page).
 * Runs on wide screens with a mouse or trackpad, and never with reduced motion.
 * Touch devices keep native scrolling, as Apple's HIG asks.
 */
export function useSmoothScroll() {
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(`${MQ.motion} and ${MQ.wide} and ${MQ.fine}`, () => {
      const root = document.documentElement
      root.classList.add('smooth-on')
      const smoother = ScrollSmoother.create({
        wrapper: '#smooth-wrapper',
        content: '#smooth-content',
        smooth: 1.1,
        effects: true,
        normalizeScroll: false,
      })
      return () => {
        smoother.kill()
        root.classList.remove('smooth-on')
      }
    })
    return () => mm.revert()
  })
}
