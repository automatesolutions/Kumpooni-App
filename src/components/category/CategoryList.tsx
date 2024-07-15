import {
  Image,
  StyleProp,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'

import { Text } from '../Typography'

import { atoms as a, useTheme } from '#/theme'
import { useNavigation } from '@react-navigation/native'
import { NavigationProp } from '#/lib/routes/types'
import { Categories } from '#/types/automate'

export function CategoryList({
  style,
  category,
}: {
  category: Categories[] | undefined
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  return (
    <View style={[style]}>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          rowGap: 12,
          marginVertical: 10,
        }}>
        {category?.map(cat => (
          <TouchableOpacity
            key={`${cat.id}`}
            style={{
              width: `${100 / 4}%`,
              alignItems: 'center',
              gap: 2,
              height: 60,
            }}
            onPress={() =>
              navigation.navigate('Services', {
                categoryId: cat.id,
                categoryName: cat.name,
              })
            }>
            <Image
              source={{
                uri:
                  cat?.img_url ??
                  'https://vheyzzpdmmyiejsxerzg.supabase.co/storage/v1/object/public/icon/engine.png',
              }}
              style={{ height: 40, aspectRatio: 1, resizeMode: 'contain' }}
            />
            <View style={[{ paddingVertical: 2, paddingHorizontal: 4 }]}>
              <Text style={[a.text_xs, a.font_normal]}>{cat.name}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}
