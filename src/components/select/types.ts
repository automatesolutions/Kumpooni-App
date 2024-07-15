import { StyleProp, ViewStyle } from 'react-native'

export interface SelectOption<T> {
  value: T
  label: string
}

export interface SelectProps<T = string | number> {
  value?: T
  placeholder?: string
  options?: SelectOption<T>[]
  disabled?: boolean
  onChange: (value: T) => void
  styles?: StyleProp<ViewStyle>
  invalid?: boolean
}
