import React from 'react'
import { ActivityIndicator, StyleProp, ViewStyle } from 'react-native'

const LoaderComponent = ({
  size = 'large',
  color = '#b61616',
  ...props
}: {
  size?: number | 'small' | 'large' | undefined
  color?: string
  style?: StyleProp<ViewStyle>
}) => {
  return <ActivityIndicator color={color} size={size} {...props} />
}

export { LoaderComponent }
