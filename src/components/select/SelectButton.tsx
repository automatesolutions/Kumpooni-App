import {
  ChevronDownIcon,
  ChevronRight,
  ChevronRightIcon,
  ChevronUpIcon,
} from 'lucide-react-native'
import React, { forwardRef } from 'react'
import {
  Pressable,
  Text,
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native'

interface SelectButtonProps {
  label: string
  open: boolean
  invalid?: boolean
  disabled?: boolean
  onPress?: () => void
  styles?: StyleProp<ViewStyle>
}

export const SelectButton: React.FC<SelectButtonProps> = forwardRef(
  (
    { label, disabled, open, styles: overideStyle, invalid, onPress, ...rest },
    ref,
  ) => {
    return (
      <>
        <Pressable
          //@ts-ignore
          ref={ref}
          onPress={onPress}
          disabled={disabled}
          {...rest}>
          <View
            style={[
              styles.containerStyle,
              overideStyle,
              { opacity: disabled ? 0.5 : 1 },
            ]}>
            <Text
              style={[
                styles.label,
                { color: disabled ? '#625C58' : invalid ? 'red' : '#1e1e1e' },
              ]}>
              {label}
            </Text>
            {open ? (
              <ChevronUpIcon
                height={24}
                width={24}
                color={invalid ? 'red' : '#000'}
              />
            ) : (
              <ChevronDownIcon
                height={24}
                width={24}
                color={invalid ? 'red' : '#000'}
              />
            )}
          </View>
        </Pressable>
        {invalid && <Text style={styles.helperText}>{'required*'}</Text>}
      </>
    )
  },
)

SelectButton.displayName = 'SelectButton'

const styles = StyleSheet.create({
  containerStyle: {
    paddingLeft: 16,
    paddingRight: 8,
    borderRadius: 5,
    borderWidth: 1,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 15,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  helperText: {
    marginHorizontal: 16,
    color: 'red',
    fontSize: 10,
  },
})
