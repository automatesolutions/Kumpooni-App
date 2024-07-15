import {
  View,
  TextInput,
  StyleProp,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from 'react-native'

import { useState } from 'react'
import { colors, countryList, spacing } from '#/utils/theme'
import { atoms as a, useTheme } from '#/theme'
import { Text } from '../Typography'

type PhoneFieldProps = {
  style?: StyleProp<TextStyle>
  label: string
  invalid: boolean
  error: any
  contentContainerStyle?: StyleProp<ViewStyle>
} & React.ComponentProps<typeof TextInput>

export default function PhoneField({
  contentContainerStyle,
  label,
  style,
  invalid,
  error,
  ...textInputProps
}: PhoneFieldProps) {
  const [isEditable, setIsEditable] = useState(false)
  const t = useTheme()
  const handleFocus = () => {
    // Prevent editing by setting isEditable to false on focus
    setIsEditable(false)
  }
  const showFlex = (invalid: boolean) => (invalid ? 'flex' : 'none')
  return (
    <View style={styles.field}>
      <Text style={[a.text_sm, a.font_bold]}>{label}</Text>
      <View style={[styles.flexRow, { paddingTop: spacing.micro }]}>
        <Text
          style={
            styles.countryCode
          }>{`${countryList.emoji} ${countryList.dial_code}`}</Text>
        <TextInput style={styles.textInputStyle} {...textInputProps} />
      </View>

      <Text
        style={[
          a.text_xs,
          { display: showFlex(invalid), paddingTop: 4, color: colors.error },
        ]}>
        {`Please enter a valid phone number`}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    fontSize: 14,
    padding: 0,
    marginRight: 10,
    fontWeight: 'bold',
  },
  field: {
    width: '100%',
    padding: spacing.medium,
    paddingBottom: spacing.small,
    backgroundColor: '#efefef',
    borderRadius: 10,
  },
  textInputStyle: {
    color: colors.black,
    padding: 0,
    fontWeight: '500',
    flex: 1,
  },
})
