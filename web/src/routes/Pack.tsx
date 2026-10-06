import {Link, useParams} from 'react-router-dom'
import dayjs from 'dayjs'
import {Printer} from '@/components/icons'
import {EmptyState, ErrorState, PageHead, Spinner} from '@/components/ui'
import {
  ATTACHMENT_LABEL,
  HINT_FOOTER,
  OLD_PARTS_LABEL,
  RESULT_LABEL,
  days,
  fileClocks,
  fileHints,
  itemTitle,
  ownerOf,
  phraseLabel,
  sortVisits,
  stayWords,
  vehicleKindLabel,
} from '@/lib/repair'
import {kindGroup} from '@/lib/kinds'
import {LETTER_DISCLAIMER, LETTER_TYPE_LABEL, composeLetter} from '@/lib/letter'
import {formatDate, formatPrice} from '@/lib/format'
import {useSession} from '@/state/session'
import {useFileQuery, useOfficesQuery, useSignedUrls} from '@/state/queries/repair'

/** One printable page with everything in the file, for DTI or the shop. */
export function PackPage() {
  const {id} = useParams()
  const {data: file, isLoading, error, refetch} = useFileQuery(id)
  const {session} = useSession()
  const owner = ownerOf(session?.user)
  const images = (file?.attachments ?? []).filter(a => a.mime_type !== 'application/pdf')
  const {data: urls} = useSignedUrls(images.map(a => a.storage_path))
  const {data: offices = []} = useOfficesQuery()

  if (isLoading) return <Spinner />
  if (error) {
    return (
      <div className="container page">
        <ErrorState error={error} onRetry={refetch} />
      </div>
    )
  }
  if (!file) {
    return (
      <div className="container page">
        <EmptyState title="We couldn't find this file" action={<Link to="/files" className="btn btn--secondary">See your repairs</Link>} />
      </div>
    )
  }

  const visits = sortVisits(file.visits)
  const clocks = fileClocks(file, visits)
  const hints = fileHints(file.vehicle?.kind, clocks)
  const stay = stayWords(file.vehicle?.kind)
  const group = kindGroup(file.vehicle?.kind)
  const slip = file.job_slip
  const letter = file.letters[0]
  const letterText = letter
    ? composeLetter(
        {file, visits: file.visits, attachments: file.attachments, slip, owner: {name: owner.name || 'Owner', mobile: owner.mobile}},
        {type: letter.letter_type, remedy: letter.remedy, language: letter.language},
        offices.find(o => o.id === letter.office_id) ?? null,
        letter.edited_text ?? letter.draft_text,
      )
    : null

  return (
    <div className="container page pack">
      <div className="no-print">
        <PageHead
          back={{to: `/files/${file.id}`, label: 'Back to the file'}}
          title="Repair timeline"
          description="Everything in this file on one page. Save it as a PDF and attach it to your complaint."
          actions={
            <button type="button" className="btn btn--primary" onClick={() => window.print()}>
              <Printer size={18} aria-hidden /> Save as PDF
            </button>
          }
        />
        <p className="small muted" style={{marginBottom: 'var(--space-6)'}}>
          In the print window, choose “Save as PDF” as the printer.
        </p>
      </div>

      <article className="pack__sheet">
        <header className="pack__head">
          <div>
            <p className="eyebrow">Repair timeline</p>
            <h1>{file.problem}</h1>
          </div>
          <p className="xsmall muted">
            Made {dayjs().format('D MMM YYYY, h:mm A')} with Kumpooni
          </p>
        </header>

        <dl className="pack__facts">
          {owner.name && (
            <div>
              <dt>Owner</dt>
              <dd>
                {owner.name}
                {owner.mobile ? `, ${owner.mobile}` : ''}
              </dd>
            </div>
          )}
          <div>
            <dt>{vehicleKindLabel(file.vehicle?.kind)}</dt>
            <dd>
              {itemTitle(file.vehicle) || 'Not set'}
              {file.vehicle?.plate_no ? `, plate ${file.vehicle.plate_no}` : ''}
              {file.vehicle?.vin_last6
                ? `, ${group === 'vehicle' ? 'VIN' : 'serial'} ending ${file.vehicle.vin_last6}`
                : ''}
            </dd>
          </div>
          <div>
            <dt>Shop</dt>
            <dd>{[file.shop_name, file.shop_city].filter(Boolean).join(', ')}</dd>
          </div>
          <div>
            <dt>First reported</dt>
            <dd>{formatDate(file.started_at, 'D MMMM YYYY')}</dd>
          </div>
          {file.peso_cap != null && (
            <div>
              <dt>Quoted</dt>
              <dd>{formatPrice(file.peso_cap)}</dd>
            </div>
          )}
          <div>
            <dt>Old parts</dt>
            <dd>{OLD_PARTS_LABEL[file.old_parts]}</dd>
          </div>
        </dl>

        <ul className="pack__clocks">
          <li>
            <strong>{clocks.attempts}</strong> {clocks.attempts === 1 ? 'visit' : 'visits'}
          </li>
          <li>
            <strong>{days(clocks.daysInShop)}</strong> {stay.at}{clocks.stillInside ? `, ${stay.stillShort}` : ''}
          </li>
          <li>
            <strong>{days(clocks.daysSinceFirst)}</strong> since first reported
          </li>
          <li>
            <strong>{formatPrice(clocks.amountPaid)}</strong> paid
          </li>
        </ul>

        <section>
          <h2>Visits</h2>
          {visits.length === 0 ? (
            <p className="muted">No visits saved.</p>
          ) : (
            <table className="pack__table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Dates</th>
                  <th scope="col">What happened</th>
                  <th scope="col">Result</th>
                  <th scope="col">Paid</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v, i) => (
                  <tr key={v.id}>
                    <td>{i + 1}</td>
                    <td>
                      {formatDate(v.date_in, 'D MMM YYYY')}
                      <br />
                      {v.date_out ? `to ${formatDate(v.date_out, 'D MMM YYYY')}` : stay.stillShort}
                    </td>
                    <td>
                      {v.story && (
                        <p>
                          <strong>Owner said:</strong> {v.story}
                        </p>
                      )}
                      {v.shop_said && (
                        <p>
                          <strong>Shop said or did:</strong> {v.shop_said}
                        </p>
                      )}
                      {v.phrases.length > 0 && (
                        <p>
                          <strong>Dealer said:</strong> {v.phrases.map(phraseLabel).join('; ')}
                        </p>
                      )}
                    </td>
                    <td>{v.result ? RESULT_LABEL[v.result] : ''}</td>
                    <td>{v.amount_paid ? formatPrice(v.amount_paid) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {slip && (
          <section>
            <h2>Job slip</h2>
            <p>
              Written {formatDate(slip.created_at, 'D MMM YYYY')}
              {slip.dropoff_at ? `, drop-off ${dayjs(slip.dropoff_at).format('D MMM YYYY, h:mm A')}` : ''}.
            </p>
            <blockquote>{slip.job_text}</blockquote>
            {slip.peso_cap != null && <p>Price limit: {formatPrice(slip.peso_cap)}</p>}
            {slip.extras.length > 0 && (
              <ul>
                {slip.extras.map(x => (
                  <li key={x.id}>
                    {x.text}
                    {x.cap != null ? ` (${formatPrice(x.cap)})` : ''}:{' '}
                    {x.answer === 'yes'
                      ? `approved ${dayjs(x.answered_at).format('D MMM, h:mm A')}`
                      : x.answer === 'no'
                        ? `not approved ${dayjs(x.answered_at).format('D MMM, h:mm A')}`
                        : 'no answer'}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {hints.length > 0 && (
          <section>
            <h2>Notes</h2>
            {hints.map(h => (
              <p key={h.id}>
                <strong>{h.title}.</strong> {h.body}
              </p>
            ))}
            <p className="xsmall muted">{HINT_FOOTER}</p>
          </section>
        )}

        {file.attachments.length > 0 && (
          <section>
            <h2>Proof ({file.attachments.length})</h2>
            <ul className="pack__proof">
              {file.attachments.map((a, i) => (
                <li key={a.id}>
                  {a.mime_type !== 'application/pdf' && urls?.[a.storage_path] && <img src={urls[a.storage_path]} alt="" />}
                  <span>
                    {i + 1}. {ATTACHMENT_LABEL[a.kind]}
                    {a.caption ? `: ${a.caption}` : ''}
                    {a.mime_type === 'application/pdf' ? ' (PDF, attach separately)' : ''}
                    <small>{formatDate(a.taken_at ?? a.created_at, 'D MMM YYYY')}</small>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="xsmall muted pack__foot">
          The owner wrote this record. Kumpooni keeps it but does not check it. This is not a legal finding.
        </p>
      </article>

      {letter && letterText && (
        <article className="pack__sheet pack__letter">
          <p className="eyebrow">
            {LETTER_TYPE_LABEL[letter.letter_type]}, saved {formatDate(letter.updated_at, 'D MMM YYYY')}
          </p>
          <pre className="letter-print">{letterText}</pre>
          <p className="xsmall muted">{LETTER_DISCLAIMER}</p>
        </article>
      )}
    </div>
  )
}
