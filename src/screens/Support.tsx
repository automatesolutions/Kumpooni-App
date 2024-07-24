import React from 'react'
import {View, StyleSheet} from 'react-native'
import {Text} from '#/components/Typography'
import {useTheme, atoms as a} from '#/theme'

type SupportProps = {}

export function SupportScreen(props: SupportProps) {
  const t = useTheme()
  return (
    <View>
      <Text>SupportScreen</Text>
    </View>
  )
}

const styles = StyleSheet.create({})
