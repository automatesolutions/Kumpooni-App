import React from 'react'
import {Link} from 'react-router-dom'
import {Search, Users} from '@/components/icons'
import {roleAtLeast} from '@/lib/business'
import {timeAgo} from '@/lib/format'
import type {MyShop} from '@/state/queries/business'
import {useCustomersQuery, useStagesQuery} from '@/state/queries/crm'
import {CardSkeletons, EmptyState, ErrorState, PageHead, Spinner} from '@/components/ui'
import {BusinessNav} from './BusinessNav'
import {shopLink, useCurrentShop} from './shared'

export function CustomersPage() {
  const {shop, isLoading, error, refetch} = useCurrentShop()
  if (isLoading) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={refetch} />
  if (!shop) {
    return (
      <div className="container page">
        <EmptyState
          title="This shop isn't on your list"
          action={
            <Link to="/business" className="btn btn--secondary">
              Show my shops
            </Link>
          }
        />
      </div>
    )
  }
  return <Customers shop={shop} />
}

function Customers({shop}: {shop: MyShop}) {
  const {data: customers, isLoading, error, refetch} = useCustomersQuery(shop.id)
  const {data: stages} = useStagesQuery(shop.id)
  const [search, setSearch] = React.useState('')
  const term = search.trim().toLowerCase()
  const shown = (customers ?? []).filter(
    c => !term || c.name.toLowerCase().includes(term) || (c.mobile ?? '').includes(term) || (c.email ?? '').toLowerCase().includes(term),
  )
  const stageName = (id: string) => stages?.find(s => s.id === id)?.name ?? ''
  const guest = !roleAtLeast(shop.role, 'member')

  return (
    <div className="container page" style={{maxWidth: 720}}>
      <BusinessNav shop={shop} />
      <PageHead
        title="Customers"
        description={guest ? 'Customers on the jobs given to you.' : 'Everyone your shop has a lead for.'}
      />
      {isLoading ? (
        <CardSkeletons count={4} height={80} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !customers?.length ? (
        <EmptyState
          icon={<Users size={28} />}
          title="No customers yet"
          action={
            !guest && (
              <Link to={shopLink('/business/leads', shop.id)} className="btn btn--secondary">
                Go to leads
              </Link>
            )
          }>
          Customers show here when they share a repair with your shop, or when you add a lead.
        </EmptyState>
      ) : (
        <>
          <div className="search" style={{marginBottom: 'var(--space-4)'}}>
            <Search size={18} aria-hidden />
            <input
              className="input"
              type="search"
              placeholder="Search by name, mobile, or email"
              aria-label="Search customers"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {!shown.length ? (
            <EmptyState icon={<Search size={28} />} title="No customer matches that">
              Check the spelling, or search by mobile number.
            </EmptyState>
          ) : (
            <ul className="card biz-list">
              {shown.map(c => (
                <li key={c.id} className="biz-row" style={{alignItems: 'flex-start'}}>
                  <div className="biz-row__main">
                    <p className="strong">{c.name}</p>
                    <p className="small muted">
                      {[c.mobile, c.email, c.source === 'share' ? 'From Kumpooni' : null].filter(Boolean).join(' · ')}
                    </p>
                    {c.leads.length > 0 && (
                      <ul className="small" style={{listStyle: 'none', marginTop: 'var(--space-1)'}}>
                        {c.leads.map(l => (
                          <li key={l.id}>
                            <Link to={shopLink(`/business/leads/${l.id}`, shop.id)} className="link" style={{display: 'inline-flex', minHeight: 'var(--tap)', alignItems: 'center'}}>
                              {l.title}
                            </Link>{' '}
                            <span className="muted">
                              · {stageName(l.stage_id)} · {timeAgo(l.updated_at)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
