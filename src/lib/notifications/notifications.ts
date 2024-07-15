import messaging from '@react-native-firebase/messaging'
import notifee, {EventType} from '@notifee/react-native'
import {PermissionsAndroid, Platform} from 'react-native'
import {PERMISSIONS, request} from 'react-native-permissions'
import {
  getApiLevel,
  getBrand,
  getBuildNumber,
  getManufacturer,
  getModel,
  getSystemName,
  getUniqueId,
  isEmulator,
} from 'react-native-device-info'
import {supabase} from '../supabase'
import {Session} from '@supabase/supabase-js'
import Notifee from '@notifee/react-native'

const isSimulator = async () => {
  const isDevice = await isEmulator()

  return (
    Platform.OS === 'ios' && isDevice === true // iOS simulator check
  )
}

export async function checkPermission() {
  const permission = await messaging().hasPermission()

  return permission
}

export async function requestPermission() {
  const apiLevel = await getApiLevel()
  const fcmToken = await messaging().getToken()
  const deviceId = await getUniqueId()
  const manufacturer = await getManufacturer()
  const devicePlatform = getSystemName()
  const model = getModel()

  const deviceName = `${manufacturer} ${model}`

  const brandName = getBrand()
  const buildNumber = getBuildNumber()

  const isAndroidAPILevelGreater32 = apiLevel > 32 && Platform.OS === 'android'
  if (isAndroidAPILevelGreater32) {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    )
  }
  await messaging().requestPermission()

  const pushData = {
    subscription_type: 'fcm',
    subscription_attributes: {
      deviceName,
      devicePlatform,
      apiLevel,
      brandName,
      buildNumber,
      push_token: fcmToken,
      device_id: deviceId,
    },
  }
}

//TODO: Optimize Update on User
export async function getFCMToken(userId: string | null) {
  let token = null

  await checkApplicationNotificationPermission()
  await registerAppWithFCM()

  if (!userId) return
  token = await messaging().getToken()
  console.log('getFcmToken-->', token)
  try {
    await supabase.from('users').update({fcm_token: token}).eq('id', userId)
  } catch (error) {
    console.error('Failed to saved fcm token')
  }
}

export async function registerAppWithFCM() {
  if (!messaging().isDeviceRegisteredForRemoteMessages) {
    await messaging()
      .registerDeviceForRemoteMessages()
      .then(status => {
        console.log('registerDeviceForRemoteMessages status', status)
      })
      .catch(error => {
        console.log('registerDeviceForRemoteMessages error ', error)
      })
  }
}

export async function checkApplicationNotificationPermission() {
  const authStatus = await messaging().requestPermission()
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL

  if (enabled) {
    console.log('Authorization status:', authStatus)
  }
  request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS)
    .then(result => {
      console.log('POST_NOTIFICATIONS status:', result)
    })
    .catch(error => {
      console.log('POST_NOTIFICATIONS error ', error)
    })
}

export function registerTokenChangeHandler(session: Session) {
  const unsubscribe = messaging().onTokenRefresh(async (fcmToken: string) => {
    try {
      await supabase
        .from('users')
        .update({id: session?.user?.id, fcm_token: fcmToken})
        .eq('id', session.user.id)
    } catch (error) {
      console.error('Notifications: Failed to set push token', {error})
    }
  })

  return () => {
    unsubscribe()
  }
}

export async function remoteRegisteredFCMToken(session: Session) {
  if (!session) return
  await supabase.from('users').update({fcm_token: ''}).eq('id', session.user.id)
}

export async function onDisplayNotification(notification: any) {
  // Request permissions (required for iOS)
  await notifee.requestPermission()

  const channelId = await Notifee.createChannel({
    id: 'my-channel',
    name: 'My Channel',
  })

  await Notifee.displayNotification({
    title: notification.title ?? '',
    body: notification.body ?? '',
    android: {
      channelId,
      smallIcon: 'ic_launcher_round',
      largeIcon: 'ic_launcher_round',
      pressAction: {
        id: 'default',
      },
    },
  })
}
