import { Check } from 'lucide-react-native'
import { View } from 'react-native'
import { Text } from '../Typography'
import { atoms as a } from '#/theme'
export function DescriptorsComp({
  descriptors,
}: {
  descriptors: string[] | null
}) {
  return (
    <View style={{ flex: 1 }}>
      {descriptors?.map((item, index) => {
        return (
          <View
            key={item + index}
            style={[a.align_start, a.flex_row, { gap: 5 }]}>
            <Check
              size={14}
              color="#41C575"
              fontWeight={'bold'}
              style={{ marginTop: 4 }}
            />
            <Text
              style={[
                a.text_xs,
                a.flex_wrap,
                a.align_center,
                {
                  maxWidth: '90%',
                },
              ]}>{`${item}`}</Text>
          </View>
        )
      })}
    </View>
  )
}
