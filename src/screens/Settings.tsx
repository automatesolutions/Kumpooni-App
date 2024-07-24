import React from 'react'
import {View, StyleSheet} from 'react-native'
import {Text} from '#/components/Typography'
import {useTheme, atoms as a} from '#/theme'

type SettingsProps = {}

export function SettingsScreen(props: SettingsProps) {
  const t = useTheme()
  return (
    <View style={[a.flex_1, t.atoms.bg_contrast_25]}>
      <Text>SettingsScreen</Text>
    </View>
  )
}

const styles = StyleSheet.create({})
