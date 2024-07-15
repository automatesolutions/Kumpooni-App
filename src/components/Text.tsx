import {
  StyleProp,
  TextStyle,
  Text as RNText,
  TextProps as RNTextProps,
} from 'react-native'
import React from 'react'
import { colors, typography } from '#/utils/theme'

type Sizes = keyof typeof $sizeStyles
type Weights = keyof typeof typography.primary
type Presets = keyof typeof $presets

interface CustomTextProps {
  /**
   * The text to display if not using `tx` or nested components.
   */
  text?: string
  /**
   * An optional style override useful for padding & margin.
   */
  style?: StyleProp<TextStyle>
  /**
   * One of the different types of text presets.
   */
  preset?: Presets
  /**
   * Text weight modifier.
   */
  weight?: Weights
  /**
   * Text size modifier.
   */
  size?: Sizes
  /**
   * Children components.
   */
  children?: React.ReactNode
}

const letterSpacing = (value: number) => {
  /*
   * If this is true... https://forum.figma.com/t/letter-spacing-should-not-be-percentage-based/3062/13
   * then 0.01em is 1%, than the size would be 16/100=0.16 pixels which means letter spacing would be 1.28 when converted.
   */
  return 0.16 * value
}
export type TextProps = CustomTextProps & RNTextProps

export function Text(props: TextProps) {
  const { weight, size, text, children, style: $styleOverride, ...rest } = props

  const content = text || children
  const preset = props.preset ?? 'default'

  const $styles = [
    $presets[preset],
    weight && $fontWeightStyles[weight],
    size && $sizeStyles[size],
    $styleOverride,
  ]

  return (
    <RNText {...rest} style={$styles}>
      {content}
    </RNText>
  )
}

const $sizeStyles = {
  xxl: { fontSize: 42, lineHeight: 46.2 } as TextStyle,
  xl: { fontSize: 32, lineHeight: 35.2 } as TextStyle,
  lg: { fontSize: 22, lineHeight: 24.2 } as TextStyle,
  md: { fontSize: 18, lineHeight: 19.8 } as TextStyle,
  sm: { fontSize: 16, lineHeight: 17.6 } as TextStyle,
  xs: { fontSize: 14, lineHeight: 15.4 } as TextStyle,
  xxs: { fontSize: 12, lineHeight: 13.2 } as TextStyle,
}

const $fontWeightStyles = Object.entries(typography.primary).reduce(
  (acc, [weight, fontFamily]) => {
    return { ...acc, [weight]: { fontFamily } }
  },
  {} as Record<Weights, TextStyle>,
) satisfies Record<Weights, TextStyle>

const $secondaryFontWeightStyles = Object.entries(typography.secondary).reduce(
  (acc, [weight, fontFamily]) => {
    return { ...acc, [weight]: { fontFamily } }
  },
  {} as Record<Weights, TextStyle>,
) satisfies Record<Weights, TextStyle>

export const $baseSecondaryStyle = [
  $sizeStyles.sm,
  $secondaryFontWeightStyles.normal,
  { color: colors.black },
] satisfies StyleProp<TextStyle>

const $baseStyle = [
  $sizeStyles.sm,
  $fontWeightStyles.normal,
  { color: colors.black },
]
const $errorStyle = [
  $sizeStyles.xs,
  $fontWeightStyles.light,
  {
    color: colors.error,
  },
]

const $presets = {
  default: $baseStyle,

  bold: [$baseStyle, $fontWeightStyles.bold] satisfies StyleProp<TextStyle>,

  heading: [
    $baseStyle,
    $sizeStyles.xxl,
    $fontWeightStyles.bold,
    { fontFamily: typography.fonts.inter.normal },
  ] satisfies StyleProp<TextStyle>,

  subheading: [
    $baseStyle,
    $sizeStyles.sm,
    $fontWeightStyles.bold,
  ] satisfies StyleProp<TextStyle>,

  formLabel: [
    $baseStyle,
    $sizeStyles.xxs,
    $fontWeightStyles.bold,
  ] satisfies StyleProp<TextStyle>,
  orderLabel: [
    $baseStyle,
    $sizeStyles.xs,
    $fontWeightStyles.bold,
  ] satisfies StyleProp<TextStyle>,
  helperText: [$errorStyle] satisfies StyleProp<TextStyle>,

  formHelper: [
    $baseStyle,
    $sizeStyles.sm,
    $fontWeightStyles.normal,
  ] satisfies StyleProp<TextStyle>,

  diagnoseLabel: [
    $baseStyle,
    $sizeStyles.xs,
    $fontWeightStyles.medium,
    { color: colors.palette.almostBlack },
  ] satisfies StyleProp<TextStyle>,

  navHeader: [
    $baseSecondaryStyle,
    $sizeStyles.sm,
    $secondaryFontWeightStyles.medium,
  ] satisfies StyleProp<TextStyle>,
  tabHeader: [
    $baseSecondaryStyle,
    $sizeStyles.sm,
    $secondaryFontWeightStyles.medium,
  ] satisfies StyleProp<TextStyle>,

  title: [
    $baseStyle,
    $sizeStyles.sm,
    $fontWeightStyles.bold,
  ] satisfies StyleProp<TextStyle>,
  paragraph: [
    $baseStyle,
    $sizeStyles.xs,
    $fontWeightStyles.light,
    { letterSpacing: letterSpacing(0.5) },
  ] satisfies StyleProp<TextStyle>,
  label: [
    $baseStyle,
    $sizeStyles.xxs,
    $fontWeightStyles.medium,
    { letterSpacing: letterSpacing(2), textTransform: 'uppercase' },
  ] satisfies StyleProp<TextStyle>,
  infoLabel: [
    $baseStyle,
    $sizeStyles.xxs,
    $fontWeightStyles.light,
    { color: colors.textDim },
  ] satisfies StyleProp<TextStyle>,
  labelSmall: [
    $baseStyle,
    $sizeStyles.xs,
    $fontWeightStyles.normal,
    { lineHeight: 14.4 },
  ] satisfies StyleProp<TextStyle>,
  primaryLabel: [
    $baseSecondaryStyle,
    $sizeStyles.xxs,
    $secondaryFontWeightStyles.medium,
    { color: colors.palette.primary500, textTransform: 'uppercase' },
  ] satisfies StyleProp<TextStyle>,
  emptyLabel: [
    $baseSecondaryStyle,
    $sizeStyles.sm,
    $secondaryFontWeightStyles.bold,
    { color: colors.black },
  ] satisfies StyleProp<TextStyle>,
}
