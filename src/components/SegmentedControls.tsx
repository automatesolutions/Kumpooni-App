import React from 'react'
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'

import { color } from '#/theme/tokens'

type SegmentedControlProps = {
  options: string[]
  selectedOption: number
  onOptionPress?: (option: number) => void
  style?: StyleProp<ViewStyle>
}

const SegmentedControls: React.FC<SegmentedControlProps> = React.memo(
  ({ options, selectedOption, onOptionPress, style }) => {
    const { width: windowWidth } = useWindowDimensions()

    const internalPadding = 0
    const segmentedControlWidth = 230

    const itemWidth = (segmentedControlWidth - internalPadding) / options.length

    const rStyle = useAnimatedStyle(() => {
      return {
        left: withTiming(itemWidth * selectedOption + internalPadding / 2),
      }
    }, [selectedOption, options, itemWidth])

    return (
      <View
        style={[
          styles.container,
          {
            width: segmentedControlWidth,
            borderRadius: 999,
            paddingLeft: internalPadding / 2,
          },
          style,
        ]}>
        <Animated.View
          style={[
            {
              width: itemWidth,
            },
            rStyle,
            styles.activeBox,
          ]}
        />
        {options.map((option, index) => {
          const isActive = selectedOption === index
          return (
            <TouchableOpacity
              onPress={() => {
                onOptionPress?.(index)
              }}
              key={option}
              style={[
                {
                  width: itemWidth,
                },
                styles.labelContainer,
              ]}>
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive ? '#fff' : '#000',
                  },
                ]}>
                {option}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    )
  },
)

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 47,
    backgroundColor: color.gray_100,
  },
  activeBox: {
    position: 'absolute',
    borderRadius: 999,
    shadowColor: 'black',
    // shadowOffset: {
    //   width: 0,
    //   height: 0,
    // },
    // shadowOpacity: 0.1,
    // elevation: 3,
    height: '100%',
    // top: '10%',
    backgroundColor: '#000',
  },
  labelContainer: { justifyContent: 'center', alignItems: 'center' },
  label: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: 'bold',
  },
})

export { SegmentedControls }
