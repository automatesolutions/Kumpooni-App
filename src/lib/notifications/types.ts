import {NotificationType} from '#/types/automate'

export interface NotificationPayload {
  id: string
  type: NotificationType
  content: string | null
  user_id: string | null
  read_at: string | null
  created_at: string
  store_id: string | null
  store_name: string | null
  repair_order_id: string | null
  is_read: boolean
}

export interface MinimalNotification {
  data?: {[key: string]: string | object}
  title?: string
  body?: string
}
