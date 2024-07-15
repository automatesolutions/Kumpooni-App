import React, { useCallback } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Text } from '#/components/Typography'
import { useTheme, atoms as a } from '#/theme'
import { ChevronRight, MapPin } from 'lucide-react-native'
import { useLocationStore } from '#/stores/location'
import { color } from '#/theme/tokens'
import { useNavigation } from '@react-navigation/native'
import { NavigationProp } from '#/lib/routes/types'
type CustomerLocationProps = {}
export function CustomerLocation(props: CustomerLocationProps) {
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const location = useLocationStore(s => s.address)

  const onPressLocation = useCallback(() => {
    navigation.navigate('Location')
  }, [navigation])

  return (
    <View style={[]}>
      <Text style={[a.font_bold, a.text_md, { paddingHorizontal: 10 }]}>
        Location
      </Text>
      <TouchableOpacity
        onPress={onPressLocation}
        style={[
          a.flex_row,
          a.justify_between,
          a.align_center,
          a.mx_2xs,
          {
            padding: 10,
            borderWidth: 0.5,
            marginTop: 2,
            borderColor: color.gray_200,
            borderRadius: 10,
          },
        ]}>
        <View style={[a.flex_row, { gap: 10 }]}>
          <MapPin size={20} color={'red'} style={[]} />
          <View style={[{ marginTop: -2 }]}>
            <Text style={[a.text_xs, a.font_bold]}>{location?.main_text}</Text>
            <Text style={[a.text_xs, a.leading_tight]}>
              {location?.secondary_text}
            </Text>
          </View>
        </View>

        <ChevronRight size={20} color={'#000'} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({})
