import React, {useCallback, useEffect, useRef} from 'react'

import {CommonActions, useNavigation} from '@react-navigation/native'

import {NavigationProp} from '../routes/types'

import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging'
import {setupAndroidChannel} from 'lib/notifications/setupAndroidChannels'
import * as notification from 'lib/notifications'
import notifee, {Event as NotifeeEvent, EventType} from '@notifee/react-native'

import {MinimalNotification, NotificationPayload} from '../notifications/types'

type Callback = () => void

export function useNotificationsHandler() {
  const navigation = useNavigation<NavigationProp>()

  const foregroundNotificationListener = useRef<Callback>()
  const notificationOpenedListener = useRef<Callback>()
  const notifeeForegroundEventListener = useRef<Callback>()

  const onForegroundRemoteNotification = (
    payload: FirebaseMessagingTypes.RemoteMessage,
  ) => {
    notification.onDisplayNotification(payload)
  }

  const handleAppOpenedWithNotification = (
    payload: FirebaseMessagingTypes.RemoteMessage | null,
  ) => {
    if (!payload) return

    const notification: MinimalNotification = {
      title: payload.notification?.title,
      body: payload.notification?.body,
      data: payload.data,
    }

    handleOpenedNotification(notification)
  }
  const handleOpenedNotification = (payload?: MinimalNotification) => {
    if (!payload) return
    const type = payload?.data?.type

    switch (type) {
      case 'scheduled':
      case 'inprogress':
      case 'awaiting-parts':
      case 'canceled':
      case 'completed':
        // casting data payload to type that was agreed on with backend
        const data = payload.data as unknown as NotificationPayload
        return navigation.navigate('OrderDetails', {
          repairOrderId: data.repair_order_id ?? '',
        })
      case 'default':
        return navigation.navigate('Notification')
    }
  }

  const handleNotificationPressed = (event: NotifeeEvent) => {
    if (event.type === EventType.PRESS) {
      handleOpenedNotification(
        event.detail.notification as FirebaseMessagingTypes.RemoteMessage,
      )
    }
  }

  useEffect(() => {
    setupAndroidChannel()
    foregroundNotificationListener.current = messaging().onMessage(
      onForegroundRemoteNotification,
    )
    notificationOpenedListener.current = messaging().onNotificationOpenedApp(
      handleAppOpenedWithNotification,
    )

    messaging().getInitialNotification().then(handleAppOpenedWithNotification)

    notifeeForegroundEventListener.current = notifee.onForegroundEvent(
      handleNotificationPressed,
    )

    return () => {
      foregroundNotificationListener.current?.()
      notificationOpenedListener.current?.()
      notificationOpenedListener.current?.()
    }
  }, [])
}
