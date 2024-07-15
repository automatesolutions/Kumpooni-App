import React, { SetStateAction, useCallback, useState } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  ListRenderItemInfo,
  TouchableOpacity,
} from 'react-native'
import { Text } from '#/components/Typography'
import { useTheme, atoms as a } from '#/theme'
import { convertTo12HourFormat } from '#/lib/utils'
import { color } from '#/theme/tokens'

export function TimeSelection({
  times,
  time,
  setTime,
}: {
  times: string[]
  time: string
  setTime: React.Dispatch<SetStateAction<string>>
}) {
  const onPressTime = useCallback((time: string, index: number) => {
    setTime(time)
  }, [])

  return (
    <View style={[a.px_xs, a.pb_sm]}>
      <View style={[a.py_sm]}>
        <Text style={[a.font_bold, a.text_md]}>Choose a time</Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          rowGap: 15,
        }}>
        {times?.map((slotTime, index) => {
          const isActive = slotTime === time
          const activeColor = isActive ? color.blue_500 : '#000'
          return (
            <TouchableOpacity
              key={slotTime}
              onPress={() => onPressTime(slotTime, index)}
              style={{
                width: `${100 / 4}%`,
                gap: 2,
                backgroundColor: isActive ? color.blue_25 : '#fff',
              }}>
              <View
                style={{
                  width: '90%',
                  borderWidth: 1,
                  borderColor: isActive ? color.blue_500 : color.gray_200,
                  alignSelf: 'flex-start',
                  borderRadius: 5,
                  marginRight: 'auto',
                  marginLeft: 'auto',
                  height: 30,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Text style={[a.text_sm, { color: activeColor }]}>
                  {convertTo12HourFormat(slotTime)}
                </Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({})
