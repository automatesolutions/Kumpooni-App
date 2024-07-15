import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '#/components/Typography'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useTheme, atoms as a } from '#/theme'
import { CommonNavigatorParams } from '#/lib/routes/types'
import { useSession } from '#/state/session'
import { UserDetailForm } from '#/components/forms/UserDetailForm'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'CreateAccount'>
export function CreateAccountScreen(props: Props) {
  const { session } = useSession()
  return (
    <View style={styles.$root}>
      <UserDetailForm userId={session?.user?.id!} />
    </View>
  )
}

const styles = StyleSheet.create({
  $root: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
})
