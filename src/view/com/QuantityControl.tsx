import { colors } from '#/lib/styles'
import { Minus, Plus } from 'lucide-react-native'
import {
  StyleProp,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'

export function QuantityControl({
  quantity,
  onUpdateQuantity,
  minimumQty = 1,
  withLabel = false,
  style,
}: {
  quantity: number
  withLabel?: boolean
  minimumQty?: number
  onUpdateQuantity: ({
    type,
    input,
  }: {
    type: 'update' | 'add' | 'subtract'
    input?: number
  }) => void
  style?: StyleProp<ViewStyle>
}) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 3,
        },
        style,
      ]}>
      {withLabel && (
        <Text style={{ fontSize: 15, fontWeight: '500', color: colors.black }}>
          Quantity
        </Text>
      )}

      <View
        style={{
          flexDirection: 'row',
          gap: 5,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.gray2,

          paddingHorizontal: 10,
          borderRadius: 5,
        }}>
        <TouchableOpacity
          style={{
            width: 30,
            alignItems: 'center',
          }}
          onPress={() => onUpdateQuantity({ type: 'subtract' })}
          disabled={quantity <= minimumQty}>
          <Minus
            size={14}
            color={quantity <= minimumQty ? colors.gray2 : colors.black}
          />
        </TouchableOpacity>
        <TextInput
          keyboardType="numeric"
          style={{
            margin: 0,
            padding: 0,
            height: 'auto',
            textAlign: 'center',
            color: colors.black,
          }}
          value={quantity === 0 ? '' : `${quantity}`}
          onBlur={() => {
            if (quantity < minimumQty) {
              onUpdateQuantity({ type: 'update', input: minimumQty })
            }
          }}
          onChangeText={qty => {
            onUpdateQuantity({ type: 'update', input: Number(qty) })
          }}
        />
        <TouchableOpacity
          style={{
            width: 30,
            alignItems: 'center',
          }}
          onPress={() => onUpdateQuantity({ type: 'add' })}>
          <Plus size={14} color={colors.black} />
        </TouchableOpacity>
      </View>
    </View>
  )
}
