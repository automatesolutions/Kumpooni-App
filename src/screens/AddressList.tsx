import React, { useLayoutEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '#/components/Typography'
import { atoms as a } from '#/theme'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AllNavigatorParams } from '#/lib/routes/types'

type Props = NativeStackScreenProps<AllNavigatorParams, 'AddressList'>
export function AddressListScreen({ navigation }: Props) {
  return (
    <View>
      <Text>AddressListScreen</Text>
    </View>
  )
}

const styles = StyleSheet.create({})
