import { colors } from '#/utils/theme'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'

export const FlatList_INTERNAL = Animated.FlatList
export function CenteredView(props) {
  return <View {...props} />
}

export function Separator(props) {
  return (
    <View
      style={[
        {
          height: 2,
          width: '100%',
          backgroundColor: colors.gray300,
        },
        props.style,
      ]}
    />
  )
}
