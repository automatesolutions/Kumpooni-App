import React, {useCallback, useImperativeHandle, useMemo, useRef} from 'react'
import {StyleSheet} from 'react-native'
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated'

import type {BottomSheetModalProps} from '@gorhom/bottom-sheet'
import {
  BottomSheetModal as _BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'

export type BottomSheetModalInstance = _BottomSheetModal

export const BottomSheetModal = React.forwardRef<
  BottomSheetModalInstance,
  BottomSheetModalProps
>((props, ref) => {
  const subtitle = '#625C58'
  const bottomSheetModalRef = useRef<_BottomSheetModal>(null)

  useImperativeHandle(
    ref,
    () => {
      return {
        present: () => bottomSheetModalRef.current?.present(),
        dismiss: () => bottomSheetModalRef.current?.dismiss(),
      }
    },
    [],
  )
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        backdropComponent={CustomBackdrop}
        disappearsOnIndex={-1}
        style={{
          ...props.style,
        }}
      />
    ),
    [],
  )
  return (
    <_BottomSheetModal
      ref={bottomSheetModalRef}
      handleIndicatorStyle={{backgroundColor: subtitle}}
      handleStyle={styles.handleStyle}
      backdropComponent={renderBackdrop}
      backgroundStyle={{backgroundColor: '#fff'}}
      {...props}
    />
  )
})

const CustomBackdrop = ({animatedIndex, style}: BottomSheetBackdropProps) => {
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animatedIndex.value,
      [-1, 0],
      [0, 1],
      Extrapolate.CLAMP,
    ),
  }))

  const containerStyle = useMemo(
    () => [style, styles.backdrop, containerAnimatedStyle],
    [style, containerAnimatedStyle],
  )

  return <Animated.View style={containerStyle} />
}

const styles = StyleSheet.create({
  handleStyle: {
    paddingTop: 12,
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
})
