// One place to register GSAP plugins. Import gsap and plugins from here, not from 'gsap'.
import {gsap} from 'gsap'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import {ScrollSmoother} from 'gsap/ScrollSmoother'
import {SplitText} from 'gsap/SplitText'
import {useGSAP} from '@gsap/react'

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollSmoother, SplitText)

// Match the CSS tokens: --ease is a gentle ease-out, --dur-slow is 320ms.
gsap.defaults({ease: 'power3.out', duration: 0.6})

/** Media queries for gsap.matchMedia(). Motion runs only in `motion`. */
export const MQ = {
  motion: '(prefers-reduced-motion: no-preference)',
  wide: '(min-width: 860px)',
  /** A mouse or trackpad. Smooth scrolling and hover effects only run here. */
  fine: '(pointer: fine)',
}

export {gsap, ScrollTrigger, ScrollSmoother, SplitText, useGSAP}
