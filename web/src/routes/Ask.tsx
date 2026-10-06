import React from 'react'
import {Link, useSearchParams} from 'react-router-dom'
import {Sparkles} from '@/components/icons'
import {Alert, Button, EmptyState, ErrorState, PageHead, Spinner} from '@/components/ui'
import {answerFromChunks, buildCorpus, retrieveChunks} from '@/lib/rag'
import {loadChat, saveChat, type ChatTurn} from '@/lib/chat-store'
import {errorMessage} from '@/lib/format'
import {useUserId} from '@/state/session'
import {useRepairPacksQuery} from '@/state/queries/repair'

export function AskPage() {
  const userId = useUserId()
  const [params] = useSearchParams()
  const fileId = params.get('file')
  const {data: packs, isLoading, error, refetch} = useRepairPacksQuery(userId)
  const files = fileId ? (packs ?? []).filter(f => f.id === fileId) : (packs ?? [])
  const scoped = files[0]
  const corpus = React.useMemo(() => buildCorpus(files), [files])
  // Only visits and photo notes hold facts worth asking about.
  const hasNotes = files.some(f => f.visits.length > 0 || f.attachments.some(a => a.caption?.trim()))
  const [question, setQuestion] = React.useState('')
  const [turns, setTurns] = React.useState<ChatTurn[]>(() => loadChat(userId, fileId))
  const bottom = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setTurns(loadChat(userId, fileId))
  }, [userId, fileId])

  React.useEffect(() => {
    bottom.current?.scrollIntoView({block: 'end'})
  }, [turns])

  const ask = (text: string) => {
    const q = text.trim()
    if (!q) return
    const hits = retrieveChunks(corpus, q)
    const reply = answerFromChunks(q, hits)
    const next: ChatTurn[] = [
      ...turns,
      {id: crypto.randomUUID(), role: 'user', text: q, at: new Date().toISOString()},
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: reply.text,
        hrefs: reply.sources.map(s => ({title: s.title, href: s.href})),
        at: new Date().toISOString(),
      },
    ]
    setTurns(next)
    saveChat(userId, fileId, next)
    setQuestion('')
  }

  return (
    <div className="container page ask">
      <PageHead
        back={fileId && scoped ? {to: `/files/${fileId}`, label: scoped.problem} : {to: '/files', label: 'Your repairs'}}
        title={scoped ? `Ask this file` : 'Ask your notes'}
        description="Answers come only from your repair files and the notes on your documents. Photos need a written note to be searchable."
      />
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !hasNotes ? (
        <EmptyState
          icon={<Sparkles size={28} />}
          title="Nothing to ask yet"
          action={
            <Link to={fileId && scoped ? `/files/${fileId}` : '/files'} className="btn btn--primary">
              {fileId && scoped ? 'Back to the file' : 'See your repairs'}
            </Link>
          }>
          Save a visit or a note on a photo first.
        </EmptyState>
      ) : (
        <div className="ask__shell">
          <p className="small muted">
            Searching {corpus.length} saved notes
            {scoped ? ` in “${scoped.problem}”` : ` across ${files.length} files`}.
          </p>
          <div className="ask__log" aria-live="polite">
            {turns.length === 0 && (
              <div className="ask__hints">
                <p className="small muted">Tap one to start:</p>
                {HINTS.map(hint => (
                  <button key={hint} type="button" className="chip" onClick={() => ask(hint)}>
                    {hint}
                  </button>
                ))}
              </div>
            )}
            {turns.map(turn => (
              <article key={turn.id} className={`ask__turn ask__turn--${turn.role}`}>
                <p>{turn.text}</p>
                {turn.hrefs && turn.hrefs.length > 0 && (
                  <p className="ask__sources">
                    {uniqueHrefs(turn.hrefs).map(s => (
                      <Link key={s.href} to={s.href} className="link">
                        {s.title}
                      </Link>
                    ))}
                  </p>
                )}
              </article>
            ))}
            <div ref={bottom} />
          </div>
          <form
            className="ask__form"
            onSubmit={e => {
              e.preventDefault()
              try {
                ask(question)
              } catch (err) {
                console.error(errorMessage(err))
              }
            }}>
            <label className="visually-hidden" htmlFor="ask-q">
              Your question
            </label>
            <div className="ask__row">
              <input
                id="ask-q"
                className="input"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="How many times did I go back?"
                autoComplete="off"
              />
              <Button type="submit" disabled={!question.trim()}>
                Ask
              </Button>
            </div>
          </form>
          <Alert>
            This chat is not legal advice. If a photo has no note, I cannot see what is in the picture.
          </Alert>
        </div>
      )}
    </div>
  )
}

const HINTS = ['How many visits?', 'What did they say?', 'Magkano na nabayaran ko?', 'What photos did I save?']

function uniqueHrefs(items: {title: string; href: string}[]) {
  const seen = new Set<string>()
  return items.filter(i => {
    if (seen.has(i.href)) return false
    seen.add(i.href)
    return true
  })
}
