import {Link} from 'react-router-dom'
import {CalendarDays, Car, Clock, ExternalLink, MapPin, Phone, Store as StoreIcon} from '@/components/icons'
import type {GooglePlace, OrderListItem} from '@/types/app'
import {formatDate, formatDistance, formatTime, plural} from '@/lib/format'
import {placePhotoUrl} from '@/lib/geo'
import {Rating, StatusBadge} from './ui'

/** A shop from Google Maps. It isn't on Kumpooni, so it can't be booked here. */
export function PlaceCard({place, style}: {place: GooglePlace; style?: React.CSSProperties}) {
  const photo = place.photos?.[0]?.name
  const open = place.regularOpeningHours?.openNow
  return (
    <article className="card shop" style={style}>
      {photo ? (
        <img className="shop__img" src={placePhotoUrl(photo)} alt="" loading="lazy" />
      ) : (
        <div className="shop__img shop__img--empty" aria-hidden>
          <StoreIcon size={32} />
        </div>
      )}
      <div className="shop__body">
        <h3>{place.displayName.text}</h3>
        <div className="meta">
          <Rating value={place.rating} count={place.userRatingCount} />
          {place.dist_meters != null && <span>{formatDistance(place.dist_meters)}</span>}
          {open != null && (
            <span style={{color: open ? 'var(--ok)' : 'var(--ink-3)'}}>
              {open ? 'Open now' : 'Closed now'}
            </span>
          )}
        </div>
        <p className="small muted">
          <MapPin size={14} aria-hidden style={{display: 'inline', verticalAlign: '-2px'}} />{' '}
          {place.shortFormattedAddress}
        </p>
        <div className="row" style={{marginTop: 'auto', paddingTop: 'var(--space-2)', flexWrap: 'wrap'}}>
          <a
            className="btn btn--secondary btn--sm"
            href={place.googleMapsUri}
            target="_blank"
            rel="noreferrer">
            <ExternalLink size={16} aria-hidden /> Directions
          </a>
          {place.nationalPhoneNumber && (
            <a className="btn btn--ghost btn--sm" href={`tel:${place.nationalPhoneNumber.replace(/\s/g, '')}`}>
              <Phone size={16} aria-hidden /> Call
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

export function OrderCard({order, style}: {order: OrderListItem; style?: React.CSSProperties}) {
  const names = order.services.map(s => s.name ?? s.service_name).filter(Boolean) as string[]
  const canReview = order.status === 'completed' && order.reviews.length === 0
  const vehicle = order.vehicle
  return (
    <article className="card card--pad stack" style={{gap: 'var(--space-3)', ...style}}>
      <div className="row row--between" style={{alignItems: 'flex-start'}}>
        <div className="row" style={{alignItems: 'flex-start'}}>
          {order.store?.store_logo ? (
            <img className="shop__logo" src={order.store.store_logo} alt="" style={{width: 44, height: 44}} />
          ) : (
            <div className="shop__logo" style={{width: 44, height: 44, display: 'grid', placeItems: 'center'}}>
              <StoreIcon size={20} className="muted" aria-hidden />
            </div>
          )}
          <div>
            <h3>{order.store?.name}</h3>
            {order.reference_no && <p className="xsmall muted">Ref. {order.reference_no}</p>}
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="meta">
        <span>
          <CalendarDays size={15} aria-hidden /> {formatDate(order.appointment_date)}
        </span>
        <span>
          <Clock size={15} aria-hidden /> {formatTime(order.appointment_time)}
        </span>
        {vehicle && (
          <span>
            <Car size={15} aria-hidden /> {vehicle.year_model} {vehicle.brand?.name} {vehicle.model?.name}
          </span>
        )}
      </div>

      <p className="small">
        <span className="strong">{plural(names.length, 'service')}:</span> {names.join(', ')}
      </p>

      <div className="row" style={{justifyContent: 'flex-end', flexWrap: 'wrap'}}>
        {canReview && (
          <Link className="btn btn--primary btn--sm" to={`/orders/${order.id}/review`}>
            Rate this shop
          </Link>
        )}
        <Link className="btn btn--secondary btn--sm" to={`/orders/${order.id}`}>
          View details
        </Link>
      </div>
    </article>
  )
}
