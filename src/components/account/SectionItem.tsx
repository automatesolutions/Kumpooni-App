import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { AccountNavigationItem } from '../../types/automate'
import { Icon } from '../utils/icon'

type SectionItemProps = {
  section: AccountNavigationItem
  hasIconRight?: boolean
  onPress: () => void
  textColor?: string
}

const SectionItem = ({
  section,
  hasIconRight,
  onPress,
  textColor,
}: SectionItemProps) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.flexRow,
      {
        flex: 1,
        alignItems: 'center',
      },
    ]}>
    <View style={{ marginRight: 24 }}>{section.iconElement}</View>

    <View style={{ flexGrow: 1, justifyContent: 'center' }}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: 'bold',
          color: textColor ? textColor : '#000',
        }}>
        {section.title}
      </Text>
      {section?.subTitle && (
        <Text
          style={{
            fontSize: 12,
            fontWeight: '400',
            color: '#625C58',
          }}>
          {section.subTitle}
        </Text>
      )}
    </View>

    {hasIconRight && (
      <View style={{ marginLeft: 'auto' }}>
        <Icon icon={'caretRight'} size={22} color={'#000'} />
      </View>
    )}
  </TouchableOpacity>
)
export { SectionItem }

const styles = StyleSheet.create({
  flexRow: {
    flexDirection: 'row',
  },
  flexCenter: { alignItems: 'center', justifyContent: 'center' },
  spacing: {
    marginVertical: 14,
  },
})
