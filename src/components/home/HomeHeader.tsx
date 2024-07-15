import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '#/components/Typography'
import { Bell } from 'lucide-react-native'
import { atoms as a, useTheme } from '#/theme'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useSession } from '#/state/session'
import { useNavigation } from '@react-navigation/native'
import { NavigationProp } from '#/lib/routes/types'
import { PinLocation } from './PinLocation'
export function HomeHeader() {
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const navigateToLocation = () => navigation.navigate('Location')
  return (
    <View style={[styles.root, a.flex_row]}>
      <PinLocation onPress={navigateToLocation} />
      <TouchableOpacity
        onPress={() => navigation.navigate('Notification')}
        style={[a.flex_row]}>
        <Bell color="black" />
        {/* {hasUnread && <View style={styles.notificationIndicator} />} */}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 16,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  notificationIndicator: {
    position: 'absolute',
    top: -4,
    right: -2,
    height: 11,
    width: 11,
    borderRadius: 20,
    backgroundColor: '#b61616',
  },
})
