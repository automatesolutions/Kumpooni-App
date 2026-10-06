import React from 'react'
import {Link, useNavigate, useParams, useSearchParams} from 'react-router-dom'
import {useForm, type UseFormReturn} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {
  AirConditioning,
  Bolt,
  Car,
  Crane,
  Home,
  Laptop,
  Motorbike,
  Pencil,
  Plus,
  Smartphone,
  Trash2,
  Tv,
  Wrench,
  type Icon,
} from '@/components/icons'
import {useUserId} from '@/state/session'
import {
  useBrandsQuery,
  useDeleteVehicleMutation,
  useModelsQuery,
  useSaveVehicleMutation,
  useVehiclesQuery,
  vehicleFormSchema,
  type VehicleForm,
} from '@/state/queries/vehicles'
import {useVehicleStore} from '@/stores/vehicle'
import {toast} from '@/stores/ui'
import {errorMessage} from '@/lib/format'
import {itemTitle} from '@/lib/repair'
import {ITEM_KINDS, kindGroup, kindInfo, kindLabel, type ItemKind} from '@/lib/kinds'
import type {Vehicle} from '@/types/app'
import {Alert, Button, CardSkeletons, Dialog, EmptyState, ErrorState, PageHead, Spinner} from '@/components/ui'
import {safeNext} from '@/components/RequireAuth'

export function vehicleLabel(v: Vehicle) {
  return itemTitle(v)
}

const KIND_ICON: Record<ItemKind, Icon> = {
  car: Car,
  motorcycle: Motorbike,
  home: Home,
  construction: Crane,
  electrical: Bolt,
  aircon: AirConditioning,
  appliance: Tv,
  computer: Laptop,
  phone: Smartphone,
  other: Wrench,
}

export function VehicleIcon({kind, size = 20}: {kind: Vehicle['kind'] | null | undefined; size?: number}) {
  const C = (kind && KIND_ICON[kind]) || Wrench
  return <C size={size} aria-hidden />
}

/** "Car · ABC 1234 · VIN …A12345", "Phone · Serial …X1Y2Z3", "Home repair". */
function itemDetails(v: Vehicle) {
  const group = kindGroup(v.kind)
  const parts: string[] = [kindLabel(v.kind)]
  if (group === 'vehicle') parts.push(v.plate_no || 'No plate number')
  if (v.vin_last6) parts.push(`${group === 'vehicle' ? 'VIN' : 'Serial'} …${v.vin_last6}`)
  return parts.join(' · ')
}

/** Radio list of the person's vehicles. Picks the first one if none is chosen. */
export function VehicleSelect({vehicles}: {vehicles: Vehicle[]}) {
  const {selectedId, select} = useVehicleStore()

  React.useEffect(() => {
    if (!vehicles.some(v => v.id === selectedId)) select(vehicles[0]?.id ?? null)
  }, [vehicles, selectedId, select])

  return (
    <fieldset className="stack" style={{border: 0, padding: 0, margin: 0, gap: 'var(--space-2)'}}>
      <legend className="label" style={{marginBottom: 'var(--space-2)'}}>
        Which one?
      </legend>
      <div className="chips chips--wrap" role="radiogroup">
        {vehicles.map(v => (
          <button
            key={v.id}
            type="button"
            role="radio"
            className="chip"
            aria-checked={selectedId === v.id}
            onClick={() => select(v.id)}>
            <VehicleIcon kind={v.kind} size={16} />
            {vehicleLabel(v)}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function VehiclesPage() {
  const userId = useUserId()
  const {data: vehicles, isLoading, error, refetch} = useVehiclesQuery(userId)
  const del = useDeleteVehicleMutation()
  const {selectedId, select} = useVehicleStore()
  const [deleting, setDeleting] = React.useState<Vehicle | null>(null)

  return (
    <div className="container page">
      <PageHead
        back={{to: '/account', label: 'Account'}}
        title="What you repair"
        description="Add each car, motorcycle, home, appliance, or gadget once. Every repair file starts from one of them."
        actions={
          vehicles?.length ? (
            <Link to="/account/vehicles/new" className="btn btn--primary">
              <Plus size={18} aria-hidden /> Add one
            </Link>
          ) : null
        }
      />
      {isLoading ? (
        <CardSkeletons count={2} height={110} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !vehicles?.length ? (
        <EmptyState
          icon={<Wrench size={28} />}
          title="Nothing added yet"
          action={
            <Link to="/account/vehicles/new" className="btn btn--primary">
              Add what needs repair
            </Link>
          }>
          Add your car, aircon, phone, or the part of your house that needs work. You'll pick it when you start a
          repair file.
        </EmptyState>
      ) : (
        <ul className="grid grid--wide reveal" style={{listStyle: 'none'}}>
          {vehicles.map((v, i) => (
            <li key={v.id} className="card card--pad row" style={{'--i': i} as React.CSSProperties}>
              <div className="vehicle-badge" aria-hidden>
                {v.brand?.img_url ? <img src={v.brand.img_url} alt="" /> : <VehicleIcon kind={v.kind} size={26} />}
              </div>
              <div style={{flex: 1, minWidth: 0}}>
                <p className="strong">{vehicleLabel(v)}</p>
                <p className="small muted">{itemDetails(v)}</p>
              </div>
              <Link to={`/account/vehicles/${v.id}`} className="icon-btn" aria-label={`Edit ${vehicleLabel(v)}`}>
                <Pencil size={18} />
              </Link>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Delete ${vehicleLabel(v)}`}
                onClick={() => setDeleting(v)}>
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete this?">
        <p>
          {deleting && vehicleLabel(deleting)} will be removed from your account. Repair files for it stay, without these
          details.
        </p>
        {del.error && <Alert>{errorMessage(del.error)}</Alert>}
        <div className="dlg__foot">
          <Button variant="ghost" onClick={() => setDeleting(null)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            loading={del.isPending}
            onClick={() =>
              deleting &&
              del.mutate(deleting.id, {
                onSuccess: () => {
                  if (selectedId === deleting.id) select(null)
                  toast('Deleted.')
                  setDeleting(null)
                },
              })
            }>
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  )
}

export function VehicleFormPage() {
  const {vehicleId} = useParams()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'), '/account/vehicles')
  const isWelcome = params.get('welcome') === '1'
  const navigate = useNavigate()
  const userId = useUserId()
  const {data: vehicles, isLoading: vehiclesLoading} = useVehiclesQuery(userId)
  const editing = vehicles?.find(v => v.id === vehicleId)
  const save = useSaveVehicleMutation()
  const select = useVehicleStore(s => s.select)

  const form = useForm<VehicleForm>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: emptyItem(ITEM_KINDS.find(k => k === params.get('kind')) ?? 'car'),
  })
  const {handleSubmit, watch, reset, setValue} = form

  React.useEffect(() => {
    if (editing) {
      reset({
        kind: editing.kind ?? 'car',
        brand_id: editing.brand?.id ?? 0,
        model_id: editing.model?.id ?? 0,
        make_text: editing.make_text ?? '',
        model_text: editing.model_text ?? '',
        year_model: editing.year_model ?? '',
        plate_no: editing.plate_no ?? '',
        vin_last6: editing.vin_last6 ?? '',
      })
    }
  }, [editing, reset])

  const kind = watch('kind')
  const info = kindInfo(kind)

  if (vehicleId && vehiclesLoading) return <Spinner />

  const onSubmit = handleSubmit(values => {
    save.mutate(
      {...values, id: editing?.id, userId},
      {
        onSuccess: saved => {
          select(saved.id)
          toast(editing ? 'Saved.' : 'Added.')
          navigate(next, {replace: true})
        },
      },
    )
  })

  return (
    <div className="container page" style={{maxWidth: 560}}>
      <PageHead
        back={isWelcome ? undefined : {to: '/account/vehicles', label: 'What you repair'}}
        title={editing ? 'Edit details' : 'What needs repair?'}
        description={
          isWelcome
            ? 'Your repair files start from this. You can skip this and add it later.'
            : 'Pick the type first.'
        }
      />
      <form className="card card--pad stack" onSubmit={onSubmit} noValidate style={{gap: 'var(--space-5)'}}>
        <fieldset className="field" style={{border: 0, padding: 0, margin: 0}}>
          <legend className="label" style={{marginBottom: 'var(--space-2)'}}>
            Type
          </legend>
          <div className="chips chips--wrap" role="radiogroup">
            {ITEM_KINDS.map(k => (
              <button
                key={k}
                type="button"
                role="radio"
                className="chip"
                aria-checked={kind === k}
                onClick={() => setValue('kind', k, {shouldValidate: false})}>
                <VehicleIcon kind={k} size={18} />
                {kindLabel(k)}
              </button>
            ))}
          </div>
        </fieldset>

        <ItemFields form={form} />

        {save.error && <Alert>{errorMessage(save.error, "We couldn't save this. Try again.")}</Alert>}
        <Button type="submit" size="lg" block loading={save.isPending}>
          {editing ? 'Save changes' : `Add ${info.noun}`}
        </Button>
        {isWelcome && (
          <Link to={next} className="btn btn--ghost btn--block">
            Skip for now
          </Link>
        )}
      </form>
    </div>
  )
}

export function emptyItem(kind: ItemKind): VehicleForm {
  return {kind, brand_id: 0, model_id: 0, make_text: '', model_text: '', year_model: '', plate_no: '', vin_last6: ''}
}

/**
 * The detail boxes for one item. They change with the type: brand lists for cars,
 * typed brand and model for motorcycles and gadgets, one name for homes and builds.
 * The add-item page and the start-a-file page both use it.
 */
export function ItemFields({
  form,
  optional = false,
  idPrefix: idp = '',
}: {
  form: UseFormReturn<VehicleForm>
  /** Every box is optional, as on the start page. */
  optional?: boolean
  idPrefix?: string
}) {
  const {
    register,
    watch,
    setValue,
    formState: {errors},
  } = form
  const kind = watch('kind')
  const isCar = kind === 'car'
  const group = kindGroup(kind)
  const info = kindInfo(kind)
  const brandId = Number(watch('brand_id'))
  const {data: brands, isLoading: brandsLoading} = useBrandsQuery(isCar)
  const {data: models, isLoading: modelsLoading} = useModelsQuery(isCar ? brandId : 0)

  const years = React.useMemo(() => {
    const now = new Date().getFullYear() + 1
    return Array.from({length: now - 1979}, (_, i) => String(now - i))
  }, [])

  return (
    <>
      {isCar ? (
        <>
          <div className="field">
            <label className="label" htmlFor={`${idp}brand`}>
              Brand {optional && <span className="muted">(optional)</span>}
            </label>
            <select
              id={`${idp}brand`}
              className="select"
              disabled={brandsLoading}
              aria-invalid={!!errors.brand_id}
              {...register('brand_id', {onChange: () => setValue('model_id', 0)})}>
              <option value={0}>{brandsLoading ? 'Loading brands…' : 'Choose a brand'}</option>
              {brands?.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {errors.brand_id && <p className="error-text">{errors.brand_id.message}</p>}
          </div>
          <div className="field">
            <label className="label" htmlFor={`${idp}model`}>
              Model {optional && <span className="muted">(optional)</span>}
            </label>
            <select
              id={`${idp}model`}
              className="select"
              disabled={!brandId || modelsLoading}
              aria-invalid={!!errors.model_id}
              {...register('model_id')}>
              <option value={0}>
                {!brandId ? 'Choose a brand first' : modelsLoading ? 'Loading models…' : 'Choose a model'}
              </option>
              {models?.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {errors.model_id && <p className="error-text">{errors.model_id.message}</p>}
          </div>
        </>
      ) : group === 'place' ? (
        <div className="field">
          <label className="label" htmlFor={`${idp}model_text`}>
            What needs work? {optional && <span className="muted">(optional)</span>}
          </label>
          <input
            id={`${idp}model_text`}
            className="input"
            placeholder={info.modelHint}
            autoComplete="off"
            aria-invalid={!!errors.model_text}
            {...register('model_text')}
          />
          {errors.model_text && <p className="error-text">{errors.model_text.message}</p>}
        </div>
      ) : (
        <>
          <div className="field">
            <label className="label" htmlFor={`${idp}make_text`}>
              Brand {optional && <span className="muted">(optional)</span>}
            </label>
            <input
              id={`${idp}make_text`}
              className="input"
              placeholder={info.brandHint}
              autoComplete="off"
              aria-invalid={!!errors.make_text}
              {...register('make_text')}
            />
            {errors.make_text && <p className="error-text">{errors.make_text.message}</p>}
          </div>
          <div className="field">
            <label className="label" htmlFor={`${idp}model_text`}>
              Model {(optional || group === 'device') && <span className="muted">(optional)</span>}
            </label>
            <input
              id={`${idp}model_text`}
              className="input"
              placeholder={info.modelHint}
              autoComplete="off"
              aria-invalid={!!errors.model_text}
              {...register('model_text')}
            />
            {errors.model_text && <p className="error-text">{errors.model_text.message}</p>}
          </div>
        </>
      )}

      {group !== 'place' && (
        <div className="field">
          <label className="label" htmlFor={`${idp}year`}>
            {group === 'vehicle' ? 'Year' : 'Year bought'}{' '}
            {(optional || group !== 'vehicle') && <span className="muted">(optional)</span>}
          </label>
          <select id={`${idp}year`} className="select" aria-invalid={!!errors.year_model} {...register('year_model')}>
            <option value="">{group === 'vehicle' ? 'Choose a year' : 'Not sure'}</option>
            {years.map(y => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          {errors.year_model && <p className="error-text">{errors.year_model.message}</p>}
        </div>
      )}
      {group === 'vehicle' && (
        <div className="field">
          <label className="label" htmlFor={`${idp}plate`}>
            Plate number <span className="muted">(optional)</span>
          </label>
          <input
            id={`${idp}plate`}
            className="input"
            maxLength={15}
            autoCapitalize="characters"
            placeholder="ABC 1234"
            style={{textTransform: 'uppercase'}}
            {...register('plate_no')}
          />
          {errors.plate_no && <p className="error-text">{errors.plate_no.message}</p>}
        </div>
      )}
      {group !== 'place' && (
        <div className="field">
          <label className="label" htmlFor={`${idp}vin`}>
            {group === 'vehicle' ? 'Last 6 of the VIN or chassis number' : 'Last 6 of the serial number'}{' '}
            <span className="muted">(optional)</span>
          </label>
          <input
            id={`${idp}vin`}
            className="input"
            maxLength={6}
            autoCapitalize="characters"
            placeholder="A12345"
            style={{textTransform: 'uppercase'}}
            aria-invalid={!!errors.vin_last6}
            aria-describedby={`${idp}vin-help`}
            {...register('vin_last6')}
          />
          <p id={`${idp}vin-help`} className="help">
            {group === 'vehicle'
              ? "It's on your OR/CR. It helps if the plate is new or missing."
              : "It's on the sticker at the back or under the battery. It proves which unit the shop had."}
          </p>
          {errors.vin_last6 && <p className="error-text">{errors.vin_last6.message}</p>}
        </div>
      )}
    </>
  )
}
