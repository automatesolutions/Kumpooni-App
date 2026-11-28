import {NavLink} from 'react-router-dom'
import {CircleUser, ClipboardList, Home, ListCheck, Messages, Users} from '@/components/icons'
import {totalUnread} from '@/lib/chat'
import {myTaskCounts} from '@/lib/tasks'
import type {MyShop} from '@/state/queries/business'
import {useChatChannelsQuery} from '@/state/queries/chat'
import {useTasksQuery} from '@/state/queries/tasks'
import {useUserId} from '@/state/session'
import {shopLink} from './shared'

/**
 * The tools of one shop, one tap apart. Shows on every shop page, with your unread
 * messages and your open tasks.
 */
export function BusinessNav({shop}: {shop: MyShop}) {
  const userId = useUserId()
  const {data: channels} = useChatChannelsQuery(shop.id)
  const {data: tasks} = useTasksQuery(shop.id)
  const unread = totalUnread(channels)
  const {open} = myTaskCounts(tasks, userId)
  const items = [
    {to: '/business', label: 'Home', icon: Home, end: true},
    {to: '/business/chat', label: 'Chat', icon: Messages, count: unread, countLabel: 'unread'},
    {to: '/business/tasks', label: 'Tasks', icon: ListCheck, count: open, countLabel: 'open for you'},
    {to: '/business/leads', label: 'Leads', icon: ClipboardList},
    {to: '/business/customers', label: 'Customers', icon: CircleUser},
    {to: '/business/team', label: 'Team', icon: Users},
  ]
  return (
    <nav className="biz-nav" aria-label={`${shop.name} tools`}>
      <ul>
        {items.map(({to, label, icon: Icon, end, count, countLabel}) => (
          <li key={to}>
            <NavLink to={shopLink(to, shop.id)} end={end} className="biz-nav__link">
              <Icon size={18} aria-hidden />
              <span>{label}</span>
              {!!count && (
                <span className="biz-nav__count">
                  {count > 99 ? '99+' : count}
                  <span className="visually-hidden"> {countLabel}</span>
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
