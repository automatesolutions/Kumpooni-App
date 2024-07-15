import React from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Pressable,
} from 'react-native'
import { Text } from '#/components/Typography'
import { useTheme, atoms as a } from '#/theme'
import { Service } from '#/types/automate'

import { DescriptorsComp } from '../store/Description'

type ServicesItemProps = {
  service: Service
  onPress: () => void
  isInCartItem: boolean
}
export function ServicesItem({
  service,
  onPress,
  isInCartItem,
}: ServicesItemProps) {
  const t = useTheme()
  return (
    <View style={[t.atoms.bg, a.flex_row, a.gap_2xs]}>
      <Image source={{ uri: service.img_url! }} style={styles.image} />
      <View>
        <Text style={[a.text_sm, a.font_bold]}>{service.name}</Text>
        <DescriptorsComp descriptors={service.inclusion} />
      </View>
      <TouchableOpacity
        onPress={onPress}
        style={[
          {
            position: 'absolute',
            right: 5,
            bottom: 0,
            backgroundColor: t.palette.black,
            paddingVertical: 5,
            borderRadius: 5,
            width: 85,
            alignItems: 'center',
          },
          isInCartItem && styles.alreadyInCart,
        ]}>
        <Text
          style={[
            { color: t.palette.white },
            a.text_xs,
            a.font_bold,
            isInCartItem && { color: '#000' },
          ]}>
          {service.service_type === 'OrderDelivery'
            ? 'Buy'
            : !isInCartItem
            ? 'Add to cart'
            : 'Added'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  image: {
    height: 90,
    aspectRatio: 1 / 1,
    borderRadius: 5,
  },
  alreadyInCart: {
    borderWidth: 1,
    backgroundColor: '#fff',
    borderColor: '#000',
  },
})
