import React from 'react'
import {Link, useNavigate} from 'react-router-dom'
import {Building, Check, FileText, Folder, Mail, MessageCircle, Scale, Sparkles} from '@/components/icons'
import {VehicleIcon} from '@/routes/Vehicles'
import {ITEM_KINDS, kindLabel} from '@/lib/kinds'
import {useSession, useUserId} from '@/state/session'
import {Coach} from '@/components/NextStep'
import {NO_FILE_STEP, nextStep} from '@/lib/next-step'
import {errorMessage} from '@/lib/format'
import {useFilesQuery, useSaveFileMutation, useUploadAttachmentMutation} from '@/state/queries/repair'
import {toast} from '@/stores/ui'
import {gsap, MQ, SplitText, useGSAP} from '@/lib/gsap'
import {useSmoothScroll} from '@/lib/useSmoothScroll'
import {ParticleReveal} from '@/components/canvasui/ParticleReveal'
import calendarIcon from '@/assets/lordicon/calendar.json'

// lottie-web is large, so the Lordicon player loads after the page.
const LordIcon = React.lazy(() => import('@/components/LordIcon'))

// Scroll reveals start faint, never invisible, so text stays readable if a trigger never fires.
const REVEAL_FROM = 0.25

const TOOLS = [
  {
    icon: Folder,
    title: 'Repair file',
    body: 'One folder per problem. The quote, the job order, receipts, photos, and the old parts.',
  },
  {
    icon: Scale,
    title: 'Same-problem counter',
    body: 'Every visit counts. See how many times they came back to it and how many days it took.',
  },
  {
    icon: FileText,
    title: 'Job slip',
    body: 'Write what the shop may do and your price limit before they start. Send them the link.',
  },
  {
    icon: MessageCircle,
    title: 'Dealer-phrase log',
    body: 'Tap what the dealer or service center said, like “service warranty lang”, and keep it on record.',
  },
  {
    icon: Mail,
    title: 'Complaint letter',
    body: 'A draft made only from your file, addressed to the nearest DTI office. You edit it and send it.',
  },
  {
    icon: Sparkles,
    title: 'Ask your files',
    body: 'Ask in plain words. Answers come only from what you saved, with a link to each source. It never makes up a peso amount or a date.',
  },
]

/** Why keep a repair file. Images are from Higgsfield, in the brand palette. */
const VALUES = [
  {
    img: '/images/home/history.webp',
    alt: 'An open folder of receipts, a repair quote, and photos of an aircon, a motorcycle, a laptop, and a leaking pipe.',
    eyebrow: 'Remember',
    title: 'Your repair history, in one place',
    body: 'When was the aircon last cleaned? Which shop did the brakes? Is the laptop screen still under warranty? Repairs are easy to forget, and the answers end up lost in your gallery and your chats. Kumpooni keeps them together, with the dates.',
    points: [
      'One file per problem, newest first',
      'The quote, receipts, photos, and old parts, each with a date',
      'A record you can look back on years later',
    ],
  },
  {
    img: '/images/home/slip.webp',
    alt: 'A customer shows a mechanic a checklist and a price limit on her phone at a repair counter.',
    eyebrow: 'Agree',
    title: 'Agree on the job before they start',
    body: 'Send the shop a job slip: what they may do and your price limit. They open it from a link, no app needed. If they want to do more, they ask first, and your yes or no is saved.',
    points: ['Your price limit, in writing', 'Extra work needs your answer', 'The shop sees it, but cannot change it'],
  },
  {
    img: '/images/home/ask.webp',
    alt: 'A phone chat whose answer links to a saved receipt, an aircon photo, and a calendar date.',
    eyebrow: 'Ask',
    title: 'Ask your files, and get answers from them',
    body: 'Ask in plain words, like “When did I last pay for the aircon?” or “What did the shop say on the second visit?” The answer comes only from what you saved, with a link to each source. If it isn’t saved, it tells you so, instead of guessing.',
    points: [
      'Searches your visits, slips, and photo notes',
      'Shows where every answer came from',
      'Never makes up a date, an amount, or a law',
    ],
  },
  {
    img: '/images/home/proof.webp',
    alt: 'A hand adds the last page to a clipped stack of dated photos and papers, beside an envelope.',
    eyebrow: 'Prove',
    title: 'Proof, if the repair fails',
    body: 'Kumpooni counts the visits and the days for you. When it is time to complain, it drafts a letter from your file and finds the nearest DTI office. You read it, change what is wrong, and file it yourself.',
    points: ['Visit and day counters', 'The whole timeline as a PDF', 'A draft letter to DTI or to the shop'],
  },
]

/** The method, in the order people use it. Each image is one scene from the same strip. */
const METHOD = [
  {
    img: '/images/home/step-1.webp',
    alt: 'Hands take a phone photo of a paper quote.',
    title: 'Save',
    body: 'Start a repair file. Pick the kind of repair and take a photo of the quote. One line about the problem is enough.',
  },
  {
    img: '/images/home/step-2.webp',
    alt: 'A phone with a checklist held out to a mechanic.',
    title: 'Agree',
    body: 'Before work starts, send the job slip with what they may do and your price limit.',
  },
  {
    img: '/images/home/step-3.webp',
    alt: 'A calendar with marked days above a house, a car, and an aircon.',
    title: 'Log',
    body: 'After every visit, add the dates, what was said, and what you paid. Add the receipt with a short note.',
  },
  {
    img: '/images/home/step-4.webp',
    alt: 'A woman reads answers on her phone beside a folder of records.',
    title: 'Use',
    body: 'Ask your files when you need to remember. Close the file when it is fixed. If it fails again, save the PDF and draft your complaint.',
  },
]

export function HomePage() {
  const root = React.useRef<HTMLDivElement>(null)

  useSmoothScroll()
  useHomeMotion(root)

  return (
    <div ref={root} className="container page">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <HeroHeading>
            <h1 id="hero-title">
              <span className="hero__line">Your repairs</span>{' '}
              <em className="hero__line">have a memory now.</em>
            </h1>
          </HeroHeading>
          <p className="hero__lead">
            Save the quote, the photos, and every visit. Look back any time, ask what happened, and have proof if the
            repair fails.
          </p>
          <HeroCoach />
          <p className="hero__fine">Free. For cars, motorcycles, homes, aircon, appliances, computers, and phones in the Philippines.</p>
        </div>
        <div className="hero__art">
          <img src="/images/mascot.png" alt="" width={260} height={420} />
        </div>
      </section>

      <section className="section" aria-labelledby="why-title">
        <div className="section-head">
          <h2 id="why-title">Why keep a repair file</h2>
        </div>
        <p className="section-lead">
          A repair is not over when you pay. The problem can come back, the warranty runs out, and the details fade.
          Kumpooni is your partner for every repair: a history you can look back on, a reminder of what was agreed, and
          proof when you need it.
        </p>
        <ul className="kind-row" aria-label="Works for">
          {ITEM_KINDS.filter(k => k !== 'other').map(k => (
            <li key={k} className="tag">
              <VehicleIcon kind={k} size={16} />
              {kindLabel(k)}
            </li>
          ))}
        </ul>
        <div className="value-list">
          {VALUES.map(v => (
            <article key={v.title} className="value-row">
              <div className="value-row__art">
                <img src={v.img} alt={v.alt} width={960} height={723} loading="lazy" decoding="async" />
              </div>
              <div className="value-row__copy">
                <p className="eyebrow">{v.eyebrow}</p>
                <h3>{v.title}</h3>
                <p>{v.body}</p>
                <ul className="value-points">
                  {v.points.map(point => (
                    <li key={point}>
                      <Check size={18} aria-hidden />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="how-title">
        <div className="section-head section-head--icon">
          <React.Suspense fallback={<span className="lordicon" style={{width: 56, height: 56}} aria-hidden />}>
            <LordIcon icon={calendarIcon} state="in-calendar" size={56} />
          </React.Suspense>
          <h2 id="how-title">The method: save, agree, log, use</h2>
        </div>
        <ol className="steps steps--method">
          {METHOD.map(m => (
            <li key={m.title} className="card">
              <img src={m.img} alt={m.alt} width={270} height={390} loading="lazy" decoding="async" />
              <div>
                <h3>{m.title}</h3>
                <p>{m.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="section" aria-labelledby="tools-title">
        <div className="section-head">
          <h2 id="tools-title">What's in it</h2>
        </div>
        <ul className="tools">
          {TOOLS.map(({icon: Icon, title, body}) => (
            <li key={title} className="card card--pad tool">
              <span className="tool__icon" aria-hidden>
                <Icon size={22} />
              </span>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="section card card--pad home-dti" aria-labelledby="dti-title">
        <Building size={28} aria-hidden />
        <div>
          <h2 id="dti-title">Where do I complain?</h2>
          <p>
            DTI handles complaints about repair shops, service centers, and dealers, and filing is free. We find the
            office nearest you.
          </p>
        </div>
        <Link to="/offices" className="btn btn--secondary">
          Find my DTI office
        </Link>
      </section>

      <section className="section card card--pad home-start" aria-labelledby="start-title">
        <h2 id="start-title">Start your first repair file</h2>
        <p>Free. Only you can see your files. A photo of the quote or one sentence is enough to begin.</p>
        <Link to="/files/new" className="btn btn--primary btn--lg">
          Start a repair file
        </Link>
      </section>
    </div>
  )
}

/**
 * The one next step on Home. No file yet: open the camera for the quote.
 * An open file: whatever that file needs next.
 */
function HeroCoach() {
  const navigate = useNavigate()
  const {session, isLoading: sessionLoading} = useSession()
  const userId = useUserId()
  const {data: files, isLoading} = useFilesQuery(userId)
  // The list comes newest first, so this is the repair you touched last.
  const file = files?.find(f => f.status === 'open')
  const step = file ? nextStep(file) : NO_FILE_STEP
  const upload = useUploadAttachmentMutation(file?.id ?? '')
  const save = useSaveFileMutation()

  if (sessionLoading || (session && isLoading) || !step) {
    return <div className="hero__actions" aria-hidden style={{minHeight: 120}} />
  }

  const href = !file
    ? undefined
    : step.id === 'complaint'
      ? `/files/${file.id}/letter`
      : step.id === 'trip' || step.id === 'another' || step.id === 'pickup'
        ? `/files/${file.id}?do=visit`
        : undefined

  return (
    <div className="hero__actions">
      <Coach
        tone="hero"
        step={step}
        busy={upload.isPending || save.isPending}
        title={
          file ? (
            <Link to={`/files/${file.id}`} className="coach__file">
              {file.problem}
            </Link>
          ) : undefined
        }
        to={href}
        onPhoto={
          step.id !== 'quote'
            ? undefined
            : photo =>
                file
                  ? upload.mutate(
                      {userId, files: [photo], kind: 'estimate', caption: null},
                      {
                        onSuccess: () => {
                          toast('Quote saved to the file.')
                          navigate(`/files/${file.id}`)
                        },
                        onError: e => toast(errorMessage(e, "We couldn't save the photo. Try again."), 'error'),
                      },
                    )
                  : navigate('/files/new', {state: {photo}})
        }
        onAction={
          step.id === 'close' && file
            ? () =>
                save.mutate(
                  {id: file.id, values: {status: 'closed'}},
                  {
                    onSuccess: () => toast('File closed. You can reopen it any time.'),
                    onError: e => toast(errorMessage(e), 'error'),
                  },
                )
            : undefined
        }
      />
      <div className="hero__links">
        <Link to={file ? '/files' : '/files/new'} className="btn hero__ghost">
          {file ? 'See all repairs' : 'Start with a sentence'}
        </Link>
      </div>
    </div>
  )
}

/**
 * Canvas UI Particle Reveal on the hero heading, for mouse and trackpad users.
 * It needs Chrome's html-in-canvas API. Other browsers, touch screens and reduced
 * motion get the plain heading.
 */
function HeroHeading({children}: {children: React.ReactNode}) {
  const [fx] = React.useState(() => matchMedia(`${MQ.fine} and ${MQ.motion}`).matches)
  const [bg] = React.useState(() => getComputedStyle(document.documentElement).getPropertyValue('--hero').trim())
  if (!fx) return <>{children}</>
  return (
    <ParticleReveal className="hero__fx" background={bg} radius={260} scatter={14} aberration={18} bend={24}>
      {children}
    </ParticleReveal>
  )
}

/** Hero intro and scroll reveals for headings, steps, and tools. */
function useHomeMotion(root: React.RefObject<HTMLDivElement>) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MQ.motion, () => {
        const intro = gsap.timeline({defaults: {ease: 'expo.out', duration: 1}})
        SplitText.create('#hero-title', {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit: self => intro.from(self.lines, {yPercent: 110, stagger: 0.1}, 0),
        })
        intro
          .from('.hero__lead', {y: 16, autoAlpha: 0}, 0.35)
          .from('.hero__actions', {y: 16, autoAlpha: 0}, 0.45)
          .from('.hero__art img', {y: 40, scale: 0.9, autoAlpha: 0, duration: 1.2}, 0.2)
        gsap.to('.hero__art img', {y: -10, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.4})

        gsap.utils.toArray<HTMLElement>('.section-head h2').forEach(h2 => {
          SplitText.create(h2, {
            type: 'words',
            mask: 'words',
            autoSplit: true,
            onSplit: self =>
              gsap.from(self.words, {
                yPercent: 100,
                stagger: 0.06,
                duration: 0.8,
                ease: 'expo.out',
                scrollTrigger: {trigger: h2, start: 'top 88%', once: true},
              }),
          })
        })

        gsap.utils.toArray<HTMLElement>('.value-row').forEach(row => {
          gsap.from(row.children, {
            y: 32,
            opacity: REVEAL_FROM,
            stagger: 0.12,
            scrollTrigger: {trigger: row, start: 'top 82%', once: true},
          })
        })

        for (const list of ['.steps li', '.tools li']) {
          gsap.from(list, {
            y: 32,
            opacity: REVEAL_FROM,
            stagger: 0.08,
            scrollTrigger: {trigger: list.split(' ')[0], start: 'top 82%', once: true},
          })
        }
      })
      return () => mm.revert()
    },
    {scope: root},
  )
}
