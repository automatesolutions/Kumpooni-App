import React, { useState } from 'react'
import { useModalControls } from '#/state/modals'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { colors } from '#/utils/theme'
import { atoms as a } from '#/theme'
import { Text } from '#/components/Typography'
import { Checkbox } from '#/components/forms/Toggle'
export const snapPoints = ['60%']

export function Component({
  onPress,
  sortBy: _sortBy,
}: {
  onPress: (filter: string) => void
  sortBy: string
}) {
  const { closeModal } = useModalControls()
  const [sortBy, setSortBy] = useState(_sortBy)

  const onCancel = () => {
    closeModal()
  }
  return (
    <View style={{ backgroundColor: '#fff' }}>
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          marginHorizontal: 16,
          flexDirection: 'row',
          borderBottomWidth: 1,
          paddingBottom: 10,
          borderColor: colors.gray,
        }}>
        <View />
        <Text
          style={{
            fontSize: 16,
            color: colors.black,
            fontWeight: '600',
            textAlign: 'center',
          }}>
          Filter
        </Text>
      </View>

      <View style={[a.px_sm]}>
        <View
          style={[
            {
              flexDirection: 'row',
              justifyContent: 'space-between',
            },
            a.py_2xs,
          ]}>
          <Text style={[a.text_md, a.font_bold]}>Distance</Text>
          <TouchableOpacity onPress={() => onPress('dist_meters')} style={[]}>
            <Checkbox />
          </TouchableOpacity>
        </View>
        <View
          style={[
            {
              flexDirection: 'row',
              justifyContent: 'space-between',
            },
            a.py_2xs,
          ]}>
          <Text style={[a.text_md, a.font_bold]}>Popularity</Text>
          <TouchableOpacity style={[]}>
            <Checkbox />
          </TouchableOpacity>
        </View>
        <View
          style={[
            {
              flexDirection: 'row',
              justifyContent: 'space-between',
            },
            a.py_2xs,
          ]}>
          <Text style={[a.text_md, a.font_bold]}>Rating</Text>
          <TouchableOpacity style={[]}>
            <Checkbox />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    padding: 14,
    marginHorizontal: 20,
  },
})
