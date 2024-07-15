import React from 'react'
import { View, StyleSheet, TouchableOpacity, Pressable } from 'react-native'
import { Text } from '#/components/Typography'
import { useTheme, atoms as a } from '#/theme'
import { useNavigation } from '@react-navigation/native'
import { NavigationProp } from '#/lib/routes/types'
import { BACK_HITSLOP } from '#/lib/constants'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'

export function ViewHeader({ canGoBack }: { canGoBack?: boolean }) {
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()

  const onPressBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [navigation])

  return (
    <View style={styles.header}>
      <View style={[a.flex_row, a.align_center, a.justify_between]}>
        <TouchableOpacity
          testID="viewHeaderDrawerBtn"
          onPress={canGoBack ? onPressBack : () => {}}
          hitSlop={BACK_HITSLOP}
          style={canGoBack ? styles.backBtn : styles.backBtnWide}
          accessibilityRole="button"
          accessibilityLabel={canGoBack ? `Back` : `Menu`}
          accessibilityHint={
            canGoBack ? '' : `Access navigation links and settings`
          }>
          {canGoBack ? (
            <FontAwesomeIcon
              size={22}
              icon="angle-left"
              style={[styles.backIcon]}
            />
          ) : null}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 12,
  },
  backBtn: {
    width: 30,
    height: 30,
  },
  backBtnWide: {
    width: 30,
    height: 30,
    paddingHorizontal: 6,
  },
  backIcon: {
    marginTop: 6,
  },
})
