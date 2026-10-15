import React from 'react'
import {Link} from 'react-router-dom'
import {Plus} from '@/components/icons'
import {Button} from '@/components/ui'
import {gsap, MQ, useGSAP} from '@/lib/gsap'
import {STARTERS, askPooni, type PooniReply} from '@/lib/pooni'
import type {RepairPack} from '@/lib/rag'

type Mood = 'idle' | 'listening' | 'thinking' | 'talking' | 'asking'

type Turn = {
  id: string
  role: 'user' | 'assistant'
  text: string
  reply?: PooniReply
}

function storageKey(userId: string, fileId: string | null) {
  return `kp-pooni:${userId}:${fileId ?? 'all'}`
}

function loadTurns(userId: string, fileId: string | null): Turn[] {
  try {
    const raw = localStorage.getItem(storageKey(userId, fileId))
    return raw ? (JSON.parse(raw) as Turn[]) : []
  } catch {
    return []
  }
}

function saveTurns(userId: string, fileId: string | null, turns: Turn[]) {
  try {
    localStorage.setItem(storageKey(userId, fileId), JSON.stringify(turns.slice(-30)))
  } catch {
    // Storage is full or blocked. The chat still works for this visit.
  }
}

const GREETING_DATA = "Hi, I'm Pooni! Ask me anything about your repairs. I only answer from what you saved here."
const GREETING_EMPTY = "Hi, I'm Pooni! You don't have any repairs yet, so I have nothing to answer from. Add a repair first, then ask me about it."

/**
 * Pooni, the Kumpooni mascot, answers questions about your repairs.
 * Answers come only from the files passed in. With no files, Pooni says there is no data.
 */
export function Pooni({
  userId,
  files,
  fileId = null,
  scopeLabel,
}: {
  userId: string
  files: RepairPack[]
  fileId?: string | null
  scopeLabel?: string
}) {
  const [turns, setTurns] = React.useState<Turn[]>(() => loadTurns(userId, fileId))
  const [question, setQuestion] = React.useState('')
  const [mood, setMood] = React.useState<Mood>('idle')
  const [typed, setTyped] = React.useState<{id: string; length: number} | null>(null)
  const log = React.useRef<HTMLDivElement>(null)
  const empty = files.length === 0

  React.useEffect(() => setTurns(loadTurns(userId, fileId)), [userId, fileId])

  // Keep the newest message in view inside the chat box.
  React.useEffect(() => {
    log.current?.scrollTo({top: log.current.scrollHeight})
  }, [turns, typed])

  // Typewriter for Pooni's newest answer. Reduced motion shows it at once.
  React.useEffect(() => {
    if (!typed) return
    const turn = turns.find(t => t.id === typed.id)
    if (!turn) return
    if (typed.length >= turn.text.length) {
      setTyped(null)
      setMood(turn.reply?.followUps.length ? 'asking' : 'idle')
      return
    }
    const t = window.setTimeout(() => setTyped({id: typed.id, length: typed.length + 3}), 14)
    return () => window.clearTimeout(t)
  }, [typed, turns])

  const busy = mood === 'thinking' || !!typed

  const ask = async (text: string) => {
    const q = text.trim()
    if (!q || busy) return
    const user: Turn = {id: crypto.randomUUID(), role: 'user', text: q}
    const withUser = [...turns, user]
    setTurns(withUser)
    setQuestion('')
    setMood('thinking')
    const history = withUser.slice(-7, -1).map(t => ({role: t.role, text: t.text}))
    // A short pause so the thinking pose reads, even when the answer is instant.
    const [reply] = await Promise.all([askPooni(q, files, history, fileId), wait(650)])
    const answer: Turn = {id: crypto.randomUUID(), role: 'assistant', text: reply.text, reply}
    const next = [...withUser, answer]
    setTurns(next)
    saveTurns(userId, fileId, next)
    const animate = window.matchMedia(MQ.motion).matches
    if (animate) {
      setMood('talking')
      setTyped({id: answer.id, length: 0})
    } else {
      setMood(reply.followUps.length ? 'asking' : 'idle')
    }
  }

  const clear = () => {
    setTurns([])
    saveTurns(userId, fileId, [])
    setMood('idle')
  }

  const last = turns[turns.length - 1]
  const offers = !busy && last?.role === 'assistant' ? (last.reply?.followUps ?? []) : []

  return (
    <section className="pooni card" aria-labelledby="pooni-title">
      <div className="pooni__side">
        <PooniMascot mood={mood} />
        <div>
          <h2 id="pooni-title" className="pooni__name">
            Ask Pooni
          </h2>
          <p className="xsmall muted">
            {empty
              ? 'No repair data yet'
              : scopeLabel
                ? `Answers from “${scopeLabel}”`
                : `Answers from your ${files.length === 1 ? 'repair' : `${files.length} repairs`}`}
          </p>
        </div>
      </div>

      <div className="pooni__chat">
        <div className="pooni__log" ref={log} aria-live="polite">
          <p className="pooni__msg pooni__msg--assistant">{empty ? GREETING_EMPTY : GREETING_DATA}</p>
          {turns.map(turn => {
            const shown = typed?.id === turn.id ? turn.text.slice(0, typed.length) : turn.text
            return (
              <div key={turn.id} className={`pooni__msg pooni__msg--${turn.role}`}>
                <p>{shown}</p>
                {turn.role === 'assistant' && typed?.id !== turn.id && turn.reply?.noData && (
                  <Link to="/files/new" className="btn btn--primary btn--sm pooni__cta">
                    <Plus size={16} aria-hidden /> Add a repair
                  </Link>
                )}
                {turn.role === 'assistant' && typed?.id !== turn.id && !!turn.reply?.sources.length && (
                  <p className="pooni__sources">
                    {unique(turn.reply.sources).map(s => (
                      <Link key={s.href} to={s.href} className="link">
                        {s.title}
                      </Link>
                    ))}
                  </p>
                )}
              </div>
            )
          })}
          {mood === 'thinking' && (
            <p className="pooni__msg pooni__msg--assistant pooni__dots" aria-label="Pooni is thinking">
              <span />
              <span />
              <span />
            </p>
          )}
        </div>

        {empty && turns.length === 0 ? (
          <Link to="/files/new" className="btn btn--primary">
            <Plus size={18} aria-hidden /> Add a repair
          </Link>
        ) : (
          (turns.length === 0 || offers.length > 0) && (
            <div className="pooni__chips">
              {(turns.length === 0 ? STARTERS : offers).map(q => (
                <button key={q} type="button" className="chip" disabled={busy} onClick={() => ask(q)}>
                  {q}
                </button>
              ))}
            </div>
          )
        )}

        <form
          className="pooni__form"
          onSubmit={e => {
            e.preventDefault()
            ask(question)
          }}>
          <label className="visually-hidden" htmlFor="pooni-q">
            Ask Pooni about your repairs
          </label>
          <input
            id="pooni-q"
            className="input"
            value={question}
            autoComplete="off"
            placeholder={empty ? 'Ask Pooni something' : 'How much did I pay for the aircon?'}
            onChange={e => {
              setQuestion(e.target.value)
              if (!busy) setMood(e.target.value ? 'listening' : 'idle')
            }}
            onBlur={() => !busy && !question && setMood('idle')}
          />
          <Button type="submit" disabled={!question.trim() || busy}>
            Ask
          </Button>
        </form>
        {turns.length > 0 && (
          <button type="button" className="link xsmall pooni__clear" onClick={clear} disabled={busy}>
            Clear chat
          </button>
        )}
      </div>
    </section>
  )
}

/**
 * The mascot moves with Pooni's mood: a slow float when idle, a lean when you type,
 * a bounce while thinking, a nod while talking, and a head tilt when asking back.
 */
function PooniMascot({mood}: {mood: Mood}) {
  const root = React.useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MQ.motion, () => {
        const body = '.pooni__mascot img'
        gsap.set(body, {transformOrigin: '50% 90%'})
        const tl = gsap.timeline({repeat: -1, yoyo: true, defaults: {ease: 'sine.inOut'}})
        if (mood === 'idle') {
          tl.to(body, {y: -4, rotation: 0, scale: 1, duration: 1.6})
        } else if (mood === 'listening') {
          tl.to(body, {rotation: -4, y: -2, scale: 1.02, duration: 0.9})
        } else if (mood === 'thinking') {
          tl.to(body, {y: -10, rotation: 3, duration: 0.32, ease: 'power1.out'})
        } else if (mood === 'talking') {
          tl.to(body, {y: -3, rotation: -2, scaleY: 1.03, duration: 0.18})
        } else {
          tl.to(body, {rotation: 7, y: -2, duration: 0.7})
        }
        return () => tl.kill()
      })
      return () => mm.revert()
    },
    {scope: root, dependencies: [mood], revertOnUpdate: true},
  )

  return (
    <div ref={root} className={`pooni__mascot pooni__mascot--${mood}`} aria-hidden>
      <img src="/images/mascot.png" alt="" width={260} height={420} />
      {mood === 'asking' && <span className="pooni__bubble">?</span>}
      {mood === 'thinking' && <span className="pooni__bubble">…</span>}
    </div>
  )
}

function wait(ms: number) {
  return new Promise(resolve => window.setTimeout(resolve, ms))
}

function unique(items: {title: string; href: string}[]) {
  const seen = new Set<string>()
  return items.filter(i => (seen.has(i.href) ? false : (seen.add(i.href), true)))
}
