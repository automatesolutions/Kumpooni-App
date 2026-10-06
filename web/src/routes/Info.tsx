import React from 'react'
import {Link} from 'react-router-dom'
import {termsMarkdown} from '@/lib/terms'
import {EmptyState, PageHead} from '@/components/ui'

/** Renders the small markdown subset used in the terms: **bold** and "- " lists. */
function renderTerms(md: string) {
  const blocks: React.ReactNode[] = []
  let list: string[] = []
  const inline = (text: string) =>
    text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
    )
  const flush = () => {
    if (list.length) {
      blocks.push(
        <ul key={`l${blocks.length}`}>
          {list.map((item, i) => (
            <li key={i}>{inline(item)}</li>
          ))}
        </ul>,
      )
      list = []
    }
  }
  for (const raw of md.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('- ')) {
      list.push(line.slice(2))
    } else if (/^\*\*[^*]+\*\*$/.test(line)) {
      flush()
      blocks.push(<h2 key={`h${blocks.length}`}>{line.slice(2, -2)}</h2>)
    } else {
      flush()
      blocks.push(<p key={`p${blocks.length}`}>{inline(line)}</p>)
    }
  }
  flush()
  return blocks
}

export function TermsPage() {
  return (
    <div className="container page">
      <PageHead title="Terms and conditions" description="The rules for using Kumpooni." />
      <article className="prose">{renderTerms(termsMarkdown)}</article>
    </div>
  )
}

export function AboutPage() {
  return (
    <div className="container page">
      <PageHead title="About Kumpooni" description="What Kumpooni is for, and how to use it." />
      <article className="prose">
        <p>
          Kumpooni keeps the history of everything you get repaired: the quote, the photos, the receipts, and every
          visit for the same problem. It works for cars and motorcycles, home repairs and construction, electrical
          work, aircon, appliances, computers, and phones.
        </p>

        <h2>Why it helps</h2>
        <h3>A repair history you won't forget</h3>
        <p>
          Most of us forget repairs fast. When was the aircon last cleaned? Which shop changed the brake pads? How much
          did the laptop screen cost, and is it still under warranty? Kumpooni keeps the answers in one place, with
          the dates and the receipts, so you don't have to dig through your gallery or your chats.
        </p>
        <h3>A partner before and during the repair</h3>
        <p>
          Before work starts, send the shop a job slip with what they may do and your price limit. During the repair,
          log each visit while you still remember what they said. Kumpooni counts the visits and the days for you,
          and shows the next thing to do.
        </p>
        <h3>Ask your files</h3>
        <p>
          Ask a question in plain words, like "When did I last pay for the aircon?" or "What did the shop say on the
          second visit?" The answer comes only from what you saved: your files, your visits, and the notes on your
          photos. Each answer shows where it came from, with a link to the file. If it isn't in your files, it tells
          you so, instead of guessing. It doesn't make up dates, amounts, or laws.
        </p>
        <h3>Proof if the repair fails</h3>
        <p>
          The most common repair problems are the same everywhere. The price goes up after the work starts. The
          problem comes back. The car, the laptop, or the half-done kitchen waits for weeks. When it ends in a
          complaint, the person with dates and receipts is the one who gets heard. Kumpooni finds the nearest DTI
          office and drafts a letter from what you saved.
        </p>

        <h2>How to use it</h2>
        <ol>
          <li>
            <strong>Sign in</strong> with your mobile number. Only you can see your files.
          </li>
          <li>
            <strong>Start a repair file.</strong> Go to <Link className="link" to="/files">Repairs</Link> and tap
            Start a repair file. Pick the kind of repair, like car, aircon, or home repair. Then take a photo of the
            quote, or write what's wrong in one line. The rest can wait.
          </li>
          <li>
            <strong>Send a job slip</strong> before work starts. Write what the shop may do and your price limit, then
            send them the link. Any extra work needs your yes or no.
          </li>
          <li>
            <strong>Log every visit.</strong> Each time the shop works on the problem, add the dates, what you told
            them, what they said, and what you paid. Add photos of receipts and old parts, and write a short note on
            each photo so you can search it later.
          </li>
          <li>
            <strong>Ask your files</strong> any time. Open a file and tap Ask this file, or tap Ask your notes on
            Repairs to search all your files at once.
          </li>
          <li>
            <strong>Close the file</strong> when it's fixed. It stays in your history, ready for the next time you
            need it.
          </li>
          <li>
            <strong>If it fails again,</strong> tap Write the complaint. Kumpooni drafts a letter from your file and
            finds the nearest <Link className="link" to="/offices">DTI office</Link>. You read it, change anything that
            is wrong, and file it yourself. You can also save the whole timeline as a PDF.
          </li>
        </ol>
        <p>
          Tip: add each car, appliance, or part of your house once, under{' '}
          <Link className="link" to="/account/vehicles">
            Account, What you repair
          </Link>
          . Every repair file can start from it, so its history stays together.
        </p>

        <h2>What we are not</h2>
        <p>
          We don't do repairs, book shops, or take payments. We are not a law office and not part of DTI. The letter
          is a draft, not legal advice. You read it, fix it, and file it yourself.
        </p>
      </article>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <div className="container page">
      <EmptyState
        image="/images/mascot.png"
        title="We can't find that page"
        action={
          <Link to="/" className="btn btn--primary">
            Go to home
          </Link>
        }>
        The link may be old, or the page has moved.
      </EmptyState>
    </div>
  )
}
