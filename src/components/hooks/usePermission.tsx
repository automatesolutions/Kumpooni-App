import { isIOS } from '#/platform/detection'
import { Linking, Alert } from 'react-native'
import { PERMISSIONS, check, request } from 'react-native-permissions'

const openPermissionAlert = (perm: string) => {
  Alert.alert(
    'Permission needed',
    `Auto-Mate does not have permission to access your ${perm}.`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ],
  )
}

export function useLocationPermission(cb?: () => void) {
  const type = isIOS
    ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
    : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION

  const requestLocationAccessIfNeeded = async () => {
    const res = await check(type)
    console.log('Res', res)
    if (res == 'granted') {
      return true
    } else if (!res || res == 'denied' || res == 'limited') {
      console.log('updatedRes')
      const updateRes = await request(type)
      if (updateRes == 'blocked') {
        console.log('Blocked')
        openPermissionAlert('location')
        return false
      }
      console.log(updateRes === 'granted')
      return updateRes == 'granted'
    } else {
      console.log('Else', res)
      openPermissionAlert('location')
      return false
    }
  }

  return { requestLocationAccessIfNeeded }
}
