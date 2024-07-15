import React from 'react'
import {
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import { useTheme, atoms as a } from '#/theme'
import { Text } from '#/components/Typography'

export function ErrorMessage({
  message,
  numberOfLines,
  style,
  onPressTryAgain,
}: {
  message: string
  numberOfLines?: number
  style?: StyleProp<ViewStyle>
  onPressTryAgain?: () => void
}) {
  const t = useTheme()

  return (
    <View testID="errorMessageView" style={[styles.outer, t.atoms.bg, style]}>
      <View
        style={[styles.errorIcon, { backgroundColor: t.palette.negative_500 }]}>
        <FontAwesomeIcon
          icon="exclamation"
          style={{ color: t.palette.black } as FontAwesomeIconStyle}
          size={16}
        />
      </View>
      <Text style={[styles.message]} numberOfLines={numberOfLines}>
        {message}
      </Text>
      {onPressTryAgain && (
        <TouchableOpacity
          testID="errorMessageTryAgainButton"
          style={styles.btn}
          onPress={onPressTryAgain}
          accessibilityRole="button"
          accessibilityLabel={`Retry`}
          accessibilityHint={`Retries the last action, which errored out`}>
          <FontAwesomeIcon
            icon="arrows-rotate"
            style={{ color: t.palette.negative_500 }}
            size={18}
          />
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  errorIcon: {
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  message: {
    flex: 1,
    paddingRight: 10,
  },
  btn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
})
