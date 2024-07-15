import { Image, View } from 'react-native'
import * as Toggle from '#/components/forms/Toggle'

import { s } from '#/lib/styles'

import { CheckThick_Stroke2_Corner0_Rounded as Check } from '#/components/icons/Check'
import { QuantityControl } from '#/view/com/QuantityControl'
import { useCallback } from 'react'
import { Text } from '../Typography'
import { color } from '#/theme/tokens'
import { currency } from '#/lib/strings/currency'
import { atoms as a } from '#/theme'
import { CartStoreItem, useCartStore } from '#/stores/cart'

export function CartItem({
  img_url,
  name,
  price,
  quantity,
  description,
  id,
  short_description,
  type,
  // is_by_quantity,
  // minimum_qty,
  variantName,
}: CartStoreItem) {
  const {
    updateServiceQtyInCart,
    increaseServiceQtyInCart,
    decreaseServiceQtyInCart,
  } = useCartStore(state => ({
    updateServiceQtyInCart: state.updateServiceQtyIncart,
    increaseServiceQtyInCart: state.increaseServiceQtyInCart,
    decreaseServiceQtyInCart: state.decreaseServiceQtyInCart,
  }))
  const onUpdateQuantity = useCallback(
    ({
      type,
      input,
    }: {
      type: 'update' | 'add' | 'subtract'
      input?: number
    }) => {
      if (type === 'update') {
        updateServiceQtyInCart(id, input ?? 0)
      } else if (type === 'add') {
        increaseServiceQtyInCart(id)
      } else if (type === 'subtract') {
        decreaseServiceQtyInCart(id)
      }
    },
    [
      updateServiceQtyInCart,
      increaseServiceQtyInCart,
      decreaseServiceQtyInCart,
      10,
    ],
  )
  return (
    <View
      style={[
        s.flexRow,
        {
          gap: 10,
          width: '100%',
        },
      ]}>
      <Image
        source={{ uri: img_url ?? '' }}
        height={60}
        width={60}
        style={{ borderRadius: 5, resizeMode: 'contain' }}
      />
      <View
        style={{
          justifyContent: 'center',
          alignSelf: 'flex-start',
          flex: 1,
        }}>
        <Text style={[a.text_md, a.font_bold]}>{name}</Text>
        {variantName && (
          <Text style={{ color: color.gray_600, fontSize: 12 }}>
            {variantName}
          </Text>
        )}
        {short_description && (
          <Text style={{ fontSize: 12, color: '#B61616', lineHeight: 14 }}>
            {short_description}
          </Text>
        )}
        {/* <Text
          style={[
            a.text_xs,
            a.font_normal,
            { alignSelf: 'flex-start', marginTop: 'auto' },
          ]}>
          {currency.format(price ?? 0)}
        </Text> */}
        {type === 'Product' && (
          <QuantityControl
            quantity={quantity}
            onUpdateQuantity={onUpdateQuantity}
            minimumQty={10 ?? 1}
          />
        )}
      </View>
    </View>
  )
}
