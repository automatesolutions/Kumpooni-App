import React, {useCallback, useEffect} from 'react'
import {View, StyleSheet, Image, AccessibilityInfo} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {Path, Svg, SvgProps} from 'react-native-svg'

import {useTheme, atoms as a} from '#/theme'
import {Logotype} from './view/icons/LogoType'
import {Text} from '#/components/Typography'
import BootSplash from 'react-native-bootsplash'

// @ts-ignore
import splashImagePointer from '../assets/bootsplash/logo.png'
// @ts-ignore

const mascotImageUri = Image.resolveAssetSource(splashImagePointer).uri
type Props = {
  isReady: boolean
}

export function Splash(props: React.PropsWithChildren<Props>) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const intro = useSharedValue(0)
  const outroLogo = useSharedValue(0)
  const outroApp = useSharedValue(0)
  const outroAppOpacity = useSharedValue(0)
  const [isAnimationComplete, setIsAnimationComplete] = React.useState(false)
  const [isLayoutReady, setIsLayoutReady] = React.useState(false)
  const [isImageLoaded, setIsImageLoaded] = React.useState(false)
  const [reduceMotion, setReduceMotion] = React.useState<boolean | undefined>(
    false,
  )
  const isReady =
    props.isReady &&
    isLayoutReady &&
    isImageLoaded &&
    reduceMotion !== undefined

  const reducedLogoAnimation = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(intro.value, [0, 1], [0.8, 1], 'clamp'),
        },
      ],
      opacity: interpolate(intro.value, [0, 1], [0, 1], 'clamp'),
    }
  })
  const logoAnimation = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(intro.value, [0, 1], [0.8, 1], 'clamp'),
        },
        {
          scale: interpolate(
            outroLogo.value,
            [0, 0.08, 1],
            [1, 0.8, 500],
            'clamp',
          ),
        },
      ],
      opacity: interpolate(intro.value, [0, 1], [0, 1], 'clamp'),
    }
  })

  const appAnimation = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(outroApp.value, [0, 1], [1.1, 1], 'clamp'),
        },
      ],
      opacity: interpolate(
        outroAppOpacity.value,
        [0, 0.1, 0.2, 1],
        [0, 0, 1, 1],
        'clamp',
      ),
    }
  })
  const logoAnimations =
    reduceMotion === true ? reducedLogoAnimation : logoAnimation
  const bottomLogoAnimation = useAnimatedStyle(() => {
    return {
      opacity: interpolate(intro.value, [0, 1], [0, 1], 'clamp'),
    }
  })

  const onFinish = useCallback(() => setIsAnimationComplete(true), [])
  const onLayout = useCallback(() => setIsLayoutReady(true), [])
  const onLoadEnd = useCallback(() => setIsImageLoaded(true), [])
  useEffect(() => {
    if (isReady) {
      BootSplash.hide()
        .then(() => {
          intro.value = withTiming(
            1,
            {duration: 400, easing: Easing.out(Easing.cubic)},
            async () => {
              // set these values to check animation at specific point
              // outroLogo.value = 0.1
              // outroApp.value = 0.1
              outroLogo.value = withTiming(
                1,
                {duration: 1200, easing: Easing.in(Easing.cubic)},
                () => {
                  runOnJS(onFinish)()
                },
              )
              outroApp.value = withTiming(1, {
                duration: 1200,
                easing: Easing.inOut(Easing.cubic),
              })
              outroAppOpacity.value = withTiming(1, {
                duration: 1200,
                easing: Easing.in(Easing.cubic),
              })
            },
          )
        })
        .catch(() => {})
    }
  }, [onFinish, intro, outroLogo, outroApp, outroAppOpacity, isReady])

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion)
  }, [])

  return (
    <View style={[a.flex_1]} onLayout={onLayout}>
      {!isAnimationComplete && (
        <View style={[StyleSheet.absoluteFillObject]}>
          <View style={[a.flex_1, a.align_center, a.justify_center]}>
            <Image
              accessibilityIgnoresInvertColors
              source={{uri: mascotImageUri}}
              height={200}
              width={200}
              resizeMode="contain"
              onLoadEnd={onLoadEnd}
              style={[{margin: 'auto'}]}
            />
          </View>

          <Animated.View
            style={[
              bottomLogoAnimation,
              {
                position: 'absolute',
                bottom: insets.bottom + 200,
                left: 0,
                right: 0,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 1,
              },
            ]}>
            <Logotype fill="red" width={200} />
          </Animated.View>
        </View>
      )}
      {isReady && (
        <>
          <Animated.View style={[{flex: 1}, appAnimation]}>
            {props.children}
          </Animated.View>

          {/* {!isAnimationComplete && (
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                logoWrapperAnimation,
                {
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  transform: [{translateY: -(insets.top / 2)}, {scale: 0.1}], // scale from 1000px to 100px
                },
              ]}></Animated.View>
          )} */}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({})
