import React from 'react'
import { useContext } from 'react'
import { Text, TextProps, View, ViewProps } from 'react-native'
import { MotiView } from 'moti'
import { Easing } from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'

import { Accordion as RNAccordion } from './lib'
import { ItemProps } from './lib/types'

type ChevronRotazeZ = 'top' | 'right' | 'bottom' | 'left'
type ChevronProps = {
  children?: any
  /**
   * Define Chevron icon arrow points in the direction.
   * @type An array of two lengths
   * e.g. rotazeZ={["right", "bottom"]}
   */
  rotazeZ?: ChevronRotazeZ[]
  height?: number
  width?: number
}
const formatRotazeZ = (rotazeZ: ChevronRotazeZ) => {
  switch (rotazeZ) {
    case 'top':
      return '0deg'
    case 'bottom':
      return '180deg'
    case 'right':
      return '90deg'
    case 'left':
      return '270deg'
    default:
      return '0deg'
  }
}
const Chevron = ({
  children,
  rotazeZ = ['bottom', 'top'],
  height = 8,
  width = 14,
}: ChevronProps) => {
  const { value: selectedValue } = useContext(RNAccordion.RootContext)
  const { value: itemValue } = useContext(RNAccordion.ItemContext)
  const isExpanded = itemValue === selectedValue

  return (
    <MotiView
      animate={{
        rotateZ: isExpanded
          ? formatRotazeZ(rotazeZ[1])
          : formatRotazeZ(rotazeZ[0]),
      }}
      transition={{
        type: 'timing',
        duration: 500,
        easing: Easing.bezier(0.87, 0, 0.13, 1),
      }}>
      {children ? (
        children
      ) : (
        <Svg width={width} height={height} fill="none">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M13.707 7.707a1 1 0 0 1-1.414 0L7 2.414 1.707 7.707A1 1 0 0 1 .293 6.293l6-6a1 1 0 0 1 1.414 0l6 6a1 1 0 0 1 0 1.414Z"
            fill={'#000'}
          />
        </Svg>
      )}
    </MotiView>
  )
}

const Item = ({ disabled, style, ...props }: ViewProps & ItemProps) => {
  return (
    <RNAccordion.Item value={props.value} disabled={disabled}>
      <View style={[{ borderRadius: 10 }, style]} {...props} />
    </RNAccordion.Item>
  )
}

const Trigger = ({ ...props }: ViewProps) => {
  return (
    <RNAccordion.Trigger>
      <View
        style={[
          {
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 4,
            paddingVertical: 5,
          },
          props.style,
        ]}
        {...props}>
        {props.children}
      </View>
    </RNAccordion.Trigger>
  )
}

const Content = ({ style, ...props }: ViewProps) => {
  return (
    <RNAccordion.Content>
      <View style={[{ padding: 4 }, style]} {...props} />
    </RNAccordion.Content>
  )
}

const Label = ({ style, ...props }: TextProps) => {
  return (
    <Text
      style={[{ fontSize: 14, fontWeight: 'bold', color: '#000' }, style]}
      {...props}
    />
  )
}

export const Accordion = {
  Root: RNAccordion.Root,
  Item,
  Trigger,
  Content,
  Label,
  Chevron,
  RNAccordion,
}
export { AnimateHeight } from './animate-height'
