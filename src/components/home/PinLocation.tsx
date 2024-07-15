import { NavigationProp } from '#/lib/routes/types'
import { useTheme } from '#/theme'
import { useNavigation } from '@react-navigation/native'
import { MapPinIcon } from 'lucide-react-native'
import { TouchableOpacity, View } from 'react-native'
import { Text } from '../Typography'
import { atoms as a } from '#/theme'
import { colors } from '#/utils/theme'
import { useLocationStore } from '#/stores/location'
export function PinLocation({ onPress }: { onPress: () => void }) {
  const t = useTheme()

  const location = useLocationStore(s => s.address)

  return (
    <View style={[t.atoms.bg, { paddingBottom: 5 }]}>
      <TouchableOpacity
        style={[a.flex_row, a.align_center, { gap: 5 }]}
        onPress={onPress}>
        <MapPinIcon size={25} color={colors.black} />
        {location ? (
          <View>
            <Text style={[a.text_xs, a.font_bold]}>{location?.main_text}</Text>
            <Text style={[a.text_xs, a.leading_tight]}>
              {location?.secondary_text}
            </Text>
          </View>
        ) : (
          <Text style={[a.text_md, a.font_bold]}>Finding location</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}
