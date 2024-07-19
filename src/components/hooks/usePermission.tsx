import {isIOS} from '#/platform/detection'
import {Linking, Alert} from 'react-native'
import {PERMISSIONS, check, request} from 'react-native-permissions'

const openPermissionAlert = (perm: string) => {
  Alert.alert(
    'Permission needed',
    `Auto-Mate does not have permission to access your ${perm}.`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {text: 'Open Settings', onPress: () => Linking.openSettings()},
    ],
  )
}

export function useLocationPermission(cb?: () => void) {
  const type = isIOS
    ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
    : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION

  const requestLocationAccessIfNeeded = async () => {
    const res = await check(type)

    if (res == 'granted') {
      return true
    } else if (!res || res == 'denied' || res == 'limited') {
      const updateRes = await request(type)
      if (updateRes == 'blocked') {
        openPermissionAlert('location')
        return false
      }

      return updateRes == 'granted'
    } else {
      openPermissionAlert('location')
      return false
    }
  }

  return {requestLocationAccessIfNeeded}
}
