import React from 'react'
import { Text } from '#/components/Typography'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { useTheme, atoms as a } from '#/theme'
import { SearchIcon } from 'lucide-react-native'
import { useNavigation } from '@react-navigation/native'
import { NavigationProp } from '#/lib/routes/types'
import { colors } from '#/lib/styles'
export function SearchBar({
  disabled,
  onPress,
  title,
  searchColor = '#b61616',
}: {
  disabled: boolean
  onPress: () => void
  title: string
  searchColor?: string
}) {
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  return (
    <View
      style={[
        a.flex_row,
        a.align_center,

        a.flex_1,
        {
          gap: 5,
        },
      ]}>
      <TouchableOpacity
        style={[a.flex_row, a.flex_1, a.align_center, styles.search]}
        onPress={onPress}
        disabled={disabled}>
        <SearchIcon size={20} color={searchColor} />
        <Text style={styles.title}>{title}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  search: {
    borderWidth: 0.5,
    borderColor: '#A3A3A3',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  title: {
    fontSize: 14,
    paddingLeft: 10,
    color: '#625C58',
  },
})
