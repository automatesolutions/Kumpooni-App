import { StyleSheet, View } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TouchableOpacity } from 'react-native-gesture-handler'

import { ShoppingCart } from 'lucide-react-native'
import { colors, spacing } from '#/utils/theme'
import { Text } from '../Typography'
import { useNavigation } from '@react-navigation/native'
import { NavigationProp } from '#/lib/routes/types'
import { atoms as a } from '#/theme'
type CartStickyProps = {
  cartCount: number
  totalPrice?: number
}
export const CartSticky = ({ cartCount, totalPrice }: CartStickyProps) => {
  const { navigate } = useNavigation<NavigationProp>()

  return (
    <View
      style={{
        position: 'absolute',
        width: '100%',
        bottom: 50,
        zIndex: 0,
        backgroundColor: '#d7d7d7',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
      }}>
      <TouchableOpacity style={[styles.root]} onPress={() => navigate('Cart')}>
        <View style={styles.rowCenter}>
          <View style={styles.counter}>
            <Text style={[a.text_2xs, styles.cartCount]}>{cartCount}</Text>
          </View>

          <ShoppingCart color={colors.black} size={24} />

          <Text style={styles.text}>My Auto-Cart</Text>
        </View>
        {/* <Text style={[styles.text, styles.small]}>
          {getPriceText(totalPrice)}
        </Text> */}
      </TouchableOpacity>
    </View>
  )
}
{
  /* <View
style={{
  position: 'absolute',
  width: '100%',
  bottom: 0,
}}
>
</View> */
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.extraLarge,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 45,
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
  },
})
