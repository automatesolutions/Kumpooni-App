import React from 'react'
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'
import dayjs from 'dayjs'
import {FileText, Folder, Plus, Sparkles} from '@/components/icons'
import {PhotoButton} from '@/components/NextStep'
import {Alert, Button, CardSkeletons, EmptyState, ErrorState, PageHead, Spinner} from '@/components/ui'
import {ItemFields, VehicleIcon, emptyItem} from '@/routes/Vehicles'
import {RESULT_LABEL, days, fileClocks, itemTitle, stayWords, vehicleName} from '@/lib/repair'
import {ITEM_KINDS, SHOP_LABEL, kindGroup, kindInfo, kindLabel, type ItemKind} from '@/lib/kinds'
import {PROBLEM_LATER, SHOP_LATER, nextStep, problemKnown, shopKnown} from '@/lib/next-step'
import {errorMessage, formatDate, plural} from '@/lib/format'
import {useUserId} from '@/state/session'
import {
  itemDetailsSchema,
  useSaveVehicleMutation,
  useVehiclesQuery,
  type VehicleForm,
} from '@/state/queries/vehicles'
import {
  useFileQuery,
  useFilesQuery,
  useSaveFileMutation,
  useStartFileMutation,
  type RepairFileListItem,
} from '@/state/queries/repair'
import {toast} from '@/stores/ui'

export function FilesPage() {
  const userId = useUserId()
  const {data: files, isLoading, error, refetch} = useFilesQuery(userId)
  const sorted = [...(files ?? [])].sort((a, b) => lastActivity(b).localeCompare(lastActivity(a)))
  const open = sorted.filter(f => f.status === 'open')
  const closed = sorted.filter(f => f.status === 'closed')
  const canAsk = sorted.some(f => f.visits.length > 0)

  return (
    <div className="container page">
      <PageHead
        title="Your repairs"
        description="One file per problem. Newest trip first."
        actions={
          files?.length ? (
            <span className="row" style={{gap: 'var(--space-2)', flexWrap: 'wrap'}}>
              {canAsk && (
                <Link to="/ask" className="btn btn--secondary">
                  <Sparkles size={18} aria-hidden /> Ask your notes
                </Link>
              )}
              <Link to="/files/new" className="btn btn--primary">
                <Plus size={18} aria-hidden /> Start a repair file
              </Link>
            </span>
          ) : null
        }
      />
      {isLoading ? (
        <CardSkeletons count={3} height={132} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !files?.length ? (
        <EmptyState
          icon={<Folder size={28} />}
          title="No repairs yet"
          action={
            <Link to="/files/new" className="btn btn--primary">
              Start a repair file
            </Link>
          }>
          Start one at the shop. A photo of the quote is enough.
        </EmptyState>
      ) : (
        <div className="stack" style={{gap: 'var(--space-7)'}}>
          <FileGroup title="Open" files={open} empty="No open repairs." />
          {closed.length > 0 && <FileGroup title="Closed" files={closed} />}
        </div>
      )}
    </div>
  )
}

/** The newest trip date, or the start date if there is no trip yet. */
function lastActivity(file: RepairFileListItem) {
  return file.visits.reduce((max, v) => (v.date_in > max ? v.date_in : max), file.started_at)
}

function FileGroup({title, files, empty}: {title: string; files: RepairFileListItem[]; empty?: string}) {
  return (
    <section className="stack" aria-label={`${title} repairs`} style={{gap: 'var(--space-3)'}}>
      <h2 className="section-title">{title}</h2>
      {files.length === 0 ? (
        <p className="muted">{empty}</p>
      ) : (
        <ul className="grid grid--wide reveal" style={{listStyle: 'none'}}>
          {files.map((f, i) => (
            <li key={f.id} style={{'--i': i} as React.CSSProperties}>
              <FileCard file={f} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function FileCard({file}: {file: RepairFileListItem}) {
  const clocks = fileClocks(file, file.visits ?? [])
  const last = [...file.visits].sort((a, b) => b.date_in.localeCompare(a.date_in))[0]
  const step = nextStep(file)
  const stay = stayWords(file.vehicle?.kind)
  return (
    <Link to={`/files/${file.id}`} className="card card--pad card--link file-card">
      <div className="row" style={{alignItems: 'flex-start'}}>
        <span className="vehicle-badge vehicle-badge--sm" aria-hidden>
          <VehicleIcon kind={file.vehicle?.kind} size={20} />
        </span>
        <div style={{minWidth: 0, flex: 1}}>
          <p className="strong file-card__problem">{file.problem}</p>
          <p className="small muted">
            {shopKnown(file.shop_name) ? file.shop_name : 'Shop not added yet'}
            {file.vehicle ? ` · ${itemTitle(file.vehicle)}` : ''}
          </p>
        </div>
        {file.status === 'closed' && <span className="tag">Closed</span>}
      </div>
      <dl className="file-card__stats">
        <div>
          <dt>Visits</dt>
          <dd>{clocks.attempts}</dd>
        </div>
        <div>
          <dt>{stay.at === 'at the shop' ? 'At the shop' : 'Days of work'}</dt>
          <dd>{days(clocks.daysInShop)}</dd>
        </div>
        <div>
          <dt>Since first report</dt>
          <dd>{days(clocks.daysSinceFirst)}</dd>
        </div>
      </dl>
      <p className="small file-card__last">
        {last
          ? `Last trip ${formatDate(last.date_in, 'D MMM')}${
              !last.date_out ? `, ${stay.stillShort}` : last.result ? ` · ${RESULT_LABEL[last.result]}` : ''
            }`
          : 'No trip logged yet'}
        {step && <span className="file-card__next">Next: {step.label.toLowerCase()}</span>}
      </p>
    </Link>
  )
}

const today = () => dayjs().format('YYYY-MM-DD')

/**
 * Photo-first start. A photo of the quote or one sentence is enough.
 * The shop, what's being repaired, and the price can wait.
 */
export function StartFilePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const userId = useUserId()
  const {data: vehicles} = useVehiclesQuery(userId)
  const start = useStartFileMutation()
  const saveItem = useSaveVehicleMutation()
  const handed = (location.state as {photo?: File} | null)?.photo ?? null
  const [photo, setPhoto] = React.useState<File | null>(handed)
  const [problem, setProblem] = React.useState('')
  const [shop, setShop] = React.useState('')
  const [error, setError] = React.useState('')
  const preview = React.useMemo(() => (photo && photo.type.startsWith('image/') ? URL.createObjectURL(photo) : null), [photo])
  React.useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview])

  // The kind of repair picks which boxes show. A saved item of that kind is used as is;
  // "new" saves one from the boxes below, even if they are left blank.
  const [kind, setKind] = React.useState<ItemKind | ''>('')
  const [itemId, setItemId] = React.useState<string>('new')
  const itemForm = useForm<VehicleForm>({resolver: zodResolver(itemDetailsSchema), defaultValues: emptyItem('car')})
  const mine = kind ? (vehicles ?? []).filter(v => v.kind === kind) : []
  const shopWords = SHOP_LABEL[kind ? kindGroup(kind) : 'vehicle']

  const pickKind = React.useCallback(
    (k: ItemKind | '') => {
      setKind(k)
      if (k) itemForm.reset(emptyItem(k))
      setItemId((vehicles ?? []).find(v => v.kind === k)?.id ?? 'new')
    },
    [vehicles, itemForm],
  )

  // One item on the account: start from its kind, once.
  const autoPicked = React.useRef(false)
  React.useEffect(() => {
    if (autoPicked.current || !vehicles) return
    autoPicked.current = true
    if (vehicles.length === 1) pickKind(vehicles[0].kind)
  }, [vehicles, pickKind])

  const busy = start.isPending || saveItem.isPending

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!kind) {
      setError('Pick what kind of repair this is.')
      return
    }
    if (!photo && problem.trim().length < 3) {
      setError("Take a photo of the quote, or say what's wrong in a few words.")
      return
    }
    if (problem.trim().length > 200) {
      setError('Keep it to one line, under 200 characters.')
      return
    }
    void itemForm.handleSubmit(async item => {
      let vehicleId: string | null = itemId === 'new' ? null : itemId
      if (itemId === 'new') {
        try {
          vehicleId = (await saveItem.mutateAsync({...item, kind, userId})).id
        } catch {
          return // saveItem.error shows below
        }
      }
      start.mutate(
        {
          userId,
          photo,
          values: {
            vehicle_id: vehicleId,
            shop_name: shop.trim() || SHOP_LATER,
            shop_city: null,
            problem: problem.trim() || PROBLEM_LATER,
            started_at: today(),
            peso_cap: null,
          },
        },
        {
          onSuccess: ({row, photoError}) => {
            if (photoError) toast(`File started, but the photo didn't save. ${photoError}`, 'error')
            else toast('Repair file started.')
            navigate(`/files/${row.id}`, {replace: true})
          },
        },
      )
    })()
  }

  const failed = error || start.error || saveItem.error

  return (
    <div className="container page" style={{maxWidth: 560}}>
      <PageHead
        back={{to: '/files', label: 'Your repairs'}}
        title="Start a repair file"
        description="Pick the kind of repair. Then a photo of the quote or one sentence is enough. Add the rest later."
      />
      <form className="card card--pad stack" onSubmit={onSubmit} noValidate style={{gap: 'var(--space-5)'}}>
        <div className="field">
          <label className="label" htmlFor="kind">
            What kind of repair?
          </label>
          <select id="kind" className="select" value={kind} onChange={e => pickKind(e.target.value as ItemKind | '')}>
            <option value="">Choose one</option>
            {ITEM_KINDS.map(k => (
              <option key={k} value={k}>
                {kindLabel(k)}
              </option>
            ))}
          </select>
        </div>

        {kind && mine.length > 0 && (
          <div className="field">
            <label className="label" htmlFor="item_id">
              Which one?
            </label>
            <select id="item_id" className="select" value={itemId} onChange={e => setItemId(e.target.value)}>
              {mine.map(v => (
                <option key={v.id} value={v.id}>
                  {itemTitle(v)}
                  {v.plate_no ? ` (${v.plate_no})` : ''}
                </option>
              ))}
              <option value="new">A new one</option>
            </select>
          </div>
        )}

        {kind && itemId === 'new' && <ItemFields form={itemForm} optional idPrefix="item-" />}

        <div className="field">
          <span className="label">Photo of the quote</span>
          {photo ? (
            <div className="start-photo">
              {preview ? <img src={preview} alt="The photo you picked" /> : <FileText size={32} aria-hidden />}
              <div className="stack" style={{gap: 'var(--space-1)', minWidth: 0}}>
                <span className="small strong start-photo__name">{photo.name}</span>
                <button
                  type="button"
                  className="link small"
                  style={{minHeight: 'var(--tap)', alignSelf: 'flex-start'}}
                  onClick={() => setPhoto(null)}>
                  Remove the photo
                </button>
              </div>
            </div>
          ) : (
            <div className="row" style={{flexWrap: 'wrap'}}>
              <PhotoButton onPick={setPhoto} variant="secondary" size="md">
                Take a photo
              </PhotoButton>
              <span className="small muted">Or a PDF, or the job order.</span>
            </div>
          )}
        </div>

        <div className="field">
          <label className="label" htmlFor="problem">
            What's wrong {photo && <span className="muted">(optional)</span>}
          </label>
          <input
            id="problem"
            className="input"
            placeholder={kindInfo(kind || 'aircon').problemHint}
            value={problem}
            onChange={e => setProblem(e.target.value)}
            aria-describedby="problem-help"
          />
          <p id="problem-help" className="help">
            One line, in your words.
          </p>
        </div>

        <div className="field">
          <label className="label" htmlFor="shop_name">
            {shopWords.label} <span className="muted">(optional)</span>
          </label>
          <input
            id="shop_name"
            className="input"
            placeholder={shopWords.hint}
            autoComplete="organization"
            value={shop}
            onChange={e => setShop(e.target.value)}
            aria-describedby="shop-help"
          />
          <p id="shop-help" className="help">
            Not sure yet? Leave it blank and add it later.
          </p>
        </div>

        {failed && (
          <Alert>
            {error ||
              (saveItem.error
                ? errorMessage(saveItem.error, "We couldn't save the details. Try again.")
                : errorMessage(start.error, "We couldn't start the file. Try again."))}
          </Alert>
        )}
        <Button type="submit" size="lg" block loading={busy}>
          Start the file
        </Button>
      </form>
      <p className="small muted" style={{marginTop: 'var(--space-4)'}}>
        Only you can see your files.
      </p>
    </div>
  )
}

const fileSchema = z.object({
  vehicle_id: z.string(),
  shop_name: z.string().trim().max(120, 'Keep it under 120 characters.'),
  shop_city: z.string().trim().max(80, 'Keep it under 80 characters.'),
  problem: z
    .string()
    .trim()
    .refine(v => v === '' || v.length >= 3, 'Say what is wrong in a few words.')
    .refine(v => v.length <= 200, 'Keep it to one line, under 200 characters.'),
  started_at: z
    .string()
    .min(1, 'Enter the date you first told the shop.')
    .refine(v => !dayjs(v).isAfter(dayjs(), 'day'), 'This date is in the future.'),
  peso_cap: z
    .string()
    .trim()
    .refine(v => v === '' || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) > 0), 'Enter an amount in pesos, like 4500.'),
})
type FileForm = z.infer<typeof fileSchema>

/** Edit the details of a file. A blank shop or problem keeps the "add it later" stand-in. */
export function FileFormPage() {
  const {id} = useParams()
  const navigate = useNavigate()
  const userId = useUserId()
  const {data: vehicles, isLoading: vehiclesLoading, error: vehiclesError, refetch} = useVehiclesQuery(userId)
  const {data: editing, isLoading: fileLoading} = useFileQuery(id)
  const save = useSaveFileMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: {errors},
  } = useForm<FileForm>({
    resolver: zodResolver(fileSchema),
    defaultValues: {vehicle_id: '', shop_name: '', shop_city: '', problem: '', started_at: today(), peso_cap: ''},
  })

  React.useEffect(() => {
    if (!editing) return
    reset({
      vehicle_id: editing.vehicle_id ?? (vehicles?.length === 1 ? vehicles[0].id : ''),
      shop_name: shopKnown(editing.shop_name) ? editing.shop_name : '',
      shop_city: editing.shop_city ?? '',
      problem: problemKnown(editing.problem) ? editing.problem : '',
      started_at: editing.started_at,
      peso_cap: editing.peso_cap != null ? String(editing.peso_cap) : '',
    })
  }, [editing, vehicles, reset])

  if (vehiclesLoading || fileLoading) return <Spinner />
  if (vehiclesError) {
    return (
      <div className="container page">
        <ErrorState error={vehiclesError} onRetry={refetch} />
      </div>
    )
  }
  if (!editing) {
    return (
      <div className="container page">
        <EmptyState
          title="We couldn't find this file"
          action={
            <Link to="/files" className="btn btn--secondary">
              See your repairs
            </Link>
          }>
          It may have been deleted.
        </EmptyState>
      </div>
    )
  }

  const onSubmit = handleSubmit(values => {
    save.mutate(
      {
        id,
        values: {
          vehicle_id: values.vehicle_id || null,
          shop_name: values.shop_name || SHOP_LATER,
          shop_city: values.shop_city || null,
          problem: values.problem || PROBLEM_LATER,
          started_at: values.started_at,
          peso_cap: values.peso_cap ? Number(values.peso_cap) : null,
        },
      },
      {
        onSuccess: row => {
          toast('File updated.')
          navigate(`/files/${row.id}`, {replace: true})
        },
      },
    )
  })

  return (
    <div className="container page" style={{maxWidth: 600}}>
      <PageHead back={{to: `/files/${id}`, label: 'Back to the file'}} title="Edit the file" />
      <form className="card card--pad stack" onSubmit={onSubmit} noValidate style={{gap: 'var(--space-5)'}}>
        <div className="field">
          <label className="label" htmlFor="problem">
            What's wrong
          </label>
          <input
            id="problem"
            className="input"
            placeholder="Aircon blows warm after 10 minutes"
            aria-invalid={!!errors.problem}
            aria-describedby="problem-help"
            {...register('problem')}
          />
          <p id="problem-help" className="help">
            One line, in your words. Use the same line every visit.
          </p>
          {errors.problem && <p className="error-text">{errors.problem.message}</p>}
        </div>

        <div className="field">
          <label className="label" htmlFor="shop_name">
            Shop or dealer
          </label>
          <input
            id="shop_name"
            className="input"
            placeholder="Name on the sign or the receipt"
            autoComplete="organization"
            aria-invalid={!!errors.shop_name}
            {...register('shop_name')}
          />
          {errors.shop_name && <p className="error-text">{errors.shop_name.message}</p>}
        </div>

        <div className="field">
          <label className="label" htmlFor="shop_city">
            Shop city <span className="muted">(optional)</span>
          </label>
          <input id="shop_city" className="input" placeholder="Quezon City" {...register('shop_city')} />
          {errors.shop_city && <p className="error-text">{errors.shop_city.message}</p>}
        </div>

        <div className="field">
          <label className="label" htmlFor="vehicle_id">
            What's being repaired <span className="muted">(optional)</span>
          </label>
          <select id="vehicle_id" className="select" {...register('vehicle_id')}>
            <option value="">Not picked yet</option>
            {(vehicles ?? []).map(v => (
              <option key={v.id} value={v.id}>
                {vehicleName(v) || kindLabel(v.kind)}
                {v.plate_no ? ` (${v.plate_no})` : ` (${kindLabel(v.kind)})`}
              </option>
            ))}
          </select>
          <Link
            to={`/account/vehicles/new?next=${encodeURIComponent(`/files/${id}/edit`)}`}
            className="link small"
            style={{minHeight: 'var(--tap)', display: 'inline-flex', alignItems: 'center'}}>
            Add something new
          </Link>
        </div>

        <div className="form-row">
          <div className="field">
            <label className="label" htmlFor="started_at">
              First told the shop
            </label>
            <input
              id="started_at"
              type="date"
              className="input"
              max={today()}
              aria-invalid={!!errors.started_at}
              {...register('started_at')}
            />
            {errors.started_at && <p className="error-text">{errors.started_at.message}</p>}
          </div>
          <div className="field">
            <label className="label" htmlFor="peso_cap">
              Quoted price, ₱ <span className="muted">(optional)</span>
            </label>
            <input
              id="peso_cap"
              className="input"
              inputMode="decimal"
              placeholder="4500"
              aria-invalid={!!errors.peso_cap}
              {...register('peso_cap')}
            />
            {errors.peso_cap && <p className="error-text">{errors.peso_cap.message}</p>}
          </div>
        </div>

        {save.error && <Alert>{errorMessage(save.error, "We couldn't save the file. Try again.")}</Alert>}
        <Button type="submit" size="lg" block loading={save.isPending}>
          Save changes
        </Button>
      </form>
      <p className="small muted" style={{marginTop: 'var(--space-4)'}}>
        Started {formatDate(editing.created_at, 'D MMM YYYY')}. {plural(editing.visits.length, 'visit')} so far.
      </p>
    </div>
  )
}
