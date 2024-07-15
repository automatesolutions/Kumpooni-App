import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { ShoppingCart } from 'lucide-react-native'

import { useNavigation } from '@react-navigation/native'
import { NavigationProp } from '#/lib/routes/types'
import { colors, spacing } from '#/utils/theme'
import { Text } from '../Typography'
import { atoms as a } from '#/theme'
type CartBottomProps = {
  cartCount: number
  floating?: boolean
  onPress: () => void
}
export const CartBottom = ({
  cartCount,
  floating,
  onPress,
}: CartBottomProps) => {
  const navigation = useNavigation<NavigationProp>()
  const floatingStyle = {
    marginBottom: 10,
    marginHorizontal: 10,
    borderRadius: 10,
  }
  return (
    <TouchableOpacity
      style={[styles.root, floating && { ...floatingStyle }]}
      onPress={onPress}>
      <View style={styles.rowCenter}>
        <View style={styles.counter}>
          <Text style={[a.text_xs, a.font_normal, styles.cartCount]}>
            {cartCount}
          </Text>
        </View>

        <ShoppingCart color={colors.black} size={24} />
        <Text style={styles.text}>My Auto-Cart</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.extraLarge,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    backgroundColor: '#D7D7D7',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  text: {
    fontSize: 14,
    color: '#000',
    fontWeight: '800',
  },
  small: {
    fontSize: 12,
  },
  counter: {
    backgroundColor: '#B61616',
    borderRadius: 10,
    height: 16,
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    alignSelf: 'flex-start',
    left: -10,
    top: -5,
  },
  cartCount: {
    color: '#fff',
    textTransform: 'uppercase',
  },
})
