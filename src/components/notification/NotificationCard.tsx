import { useDate } from '#/lib/hooks/useDate'
import { CommonNavigatorParams, NavigationProp } from '#/lib/routes/types'
import { useMarkAsRead } from '#/state/queries/notification'
import { ParsedNotification } from '#/types/automate'
import { colors, spacing, shadows } from '#/utils/theme'
import { useNavigation } from '@react-navigation/native'
import React, { useCallback } from 'react'
import { StyleSheet, View, Text, ViewStyle, Pressable } from 'react-native'

type NotificationCardProps = {
  notification: ParsedNotification
}
/**
 * Github: https://github.com/showtime-xyz/showtime-frontend/blob/bcfd350dff979455ebfd1ddb7985a67dcfa89084/packages/app/components/notifications/notification-item.tsx#L42
 */
const NOTIFICATION_TYPE_COPY = new Map([
  ['SCHEDULED', 'Your appointment is confirmed and scheduled.'],
  ['IN_PROGRESS', 'Your order is currently in progress.'],
  ['COMPLETED', 'Your order has been successfully completed.'],
])

export const NotificationCard = ({ notification }: NotificationCardProps) => {
  const navigation = useNavigation<NavigationProp>()
  const date = useDate()
  const { mutate: markAsRead } = useMarkAsRead()
  const notificationPressHandler = useCallback(() => {
    let screen_name: keyof CommonNavigatorParams | '' = ''
    let params: CommonNavigatorParams[keyof CommonNavigatorParams] | undefined

    switch (notification.notification_type) {
      case 'SCHEDULED':
      case 'IN_PROGRESS':
      case 'COMPLETED':
        screen_name = 'OrderDetails'
        params = {
          repairOrderId: notification?.repair_order_id!,
        } as CommonNavigatorParams['OrderDetails']
        break
    }
    if (!screen_name) return
    markAsRead({ id: notification.id })
    //@ts-ignore
    navigation.navigate(screen_name, params)
  }, [
    notification.notification_type,
    notification.id,
    notification.repair_order_id,
  ])
  return (
    <Pressable
      style={[
        $transactionCard,
        { backgroundColor: !notification?.is_read ? '#FFE7E7' : '#fff' },
      ]}
      onPress={() => notificationPressHandler()}>
      <View style={styles.flexJustify}>
        <Text style={styles.heading}>{notification?.store_name}</Text>
        <Text style={styles.time}>
          {date.dayjs(notification?.created_at).format('hh:mm A')}
        </Text>
      </View>
      <View style={styles.flexJustify}>
        <Text style={styles.content}>
          {NOTIFICATION_TYPE_COPY.get(notification.notification_type)}
        </Text>
        {!notification?.is_read && (
          <View
            style={{
              alignSelf: 'flex-start',
              borderWidth: 1,
              borderColor: '#EE363D',
              paddingVertical: 4,
              paddingHorizontal: 12,
              borderRadius: 5,
            }}>
            <Text
              style={{
                color: '#EE363D',
                fontSize: 12,
                fontWeight: 'bold',
              }}>
              NEW
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  flexJustify: {
    flexDirection: 'row',
    justifyContent: 'space-between',

    flex: 1,
  },
  heading: {
    color: '#1e1e1e',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    color: colors.palette.neutral600,
    fontSize: 14,
    flex: 1,
  },
  time: {
    lineHeight: spacing.medium,
    alignSelf: 'flex-end',
    fontSize: 11,
    color: colors.palette.neutral600,
  },
})

const $transactionCard: ViewStyle = {
  borderColor: colors.border,
  marginHorizontal: spacing.medium,
  paddingVertical: 10,
  paddingHorizontal: spacing.small,
  borderRadius: 5,
  gap: spacing.small,
  ...shadows.light,
}
const $button: ViewStyle = {
  width: 120,
  alignSelf: 'flex-end',
  marginBottom: 10,
}

const $viewBtn: ViewStyle = {
  borderTopLeftRadius: 0,
  borderTopRightRadius: 0,
  backgroundColor: colors.palette.neutral300,
}

const $unreadIndicator: ViewStyle = {
  backgroundColor: colors.primary,
  height: 11,
  width: 11,
  borderRadius: 20,
  position: 'absolute',
  right: 5,
}
