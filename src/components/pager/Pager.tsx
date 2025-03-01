import React, { forwardRef } from 'react'

import { View, StyleSheet, Animated } from 'react-native'

import PagerView, {
  PageScrollStateChangedNativeEvent,
  PagerViewOnPageScrollEvent,
  PagerViewOnPageSelectedEvent,
} from 'react-native-pager-view'
import { s } from '#/lib/styles'

export type PageSelectedEvent = PagerViewOnPageSelectedEvent

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView)

export interface PagerRef {
  setPage: (index: number) => void
}
export interface RenderTabBarFnProps {
  selectedPage: number
  onSelect?: (index: number) => void
}

export type RenderTabBarFn = (props: RenderTabBarFnProps) => JSX.Element
interface Props {
  initialPage?: number
  scrollEnabled: boolean
  renderTabBar: RenderTabBarFn
  onPageSelected?: (index: number) => void
  onPageSelecting?: (index: number) => void
  onPageScrollStateChanged?: (
    scrollState: 'idle' | 'dragging' | 'settling',
  ) => void
  testID?: string
}
export const Pager = forwardRef<PagerRef, React.PropsWithChildren<Props>>(
  function PagerImpl(
    {
      children,
      initialPage = 0,
      renderTabBar,
      onPageScrollStateChanged,
      onPageSelected,
      onPageSelecting,
      scrollEnabled = true,
      testID,
    },
    ref,
  ) {
    const [selectedPage, setSelectedPage] = React.useState(0)
    const lastOffset = React.useRef(0)
    const lastDirection = React.useRef(0)
    const scrollState = React.useRef('')
    const pagerView = React.useRef<PagerView>(null)

    React.useImperativeHandle(ref, () => ({
      setPage: (index: number) => pagerView.current?.setPage(index),
    }))

    const onPageSelectedInner = React.useCallback(
      (e: PageSelectedEvent) => {
        setSelectedPage(e.nativeEvent.position)
        onPageSelected?.(e.nativeEvent.position)
      },
      [setSelectedPage, onPageSelected],
    )

    const onPageScroll = React.useCallback(
      (e: PagerViewOnPageScrollEvent) => {
        const { position, offset } = e.nativeEvent
        if (offset === 0) {
          // offset hits 0 in some awkward spots so we ignore it
          return
        }
        // NOTE
        // we want to call `onPageSelecting` as soon as the scroll-gesture
        // enters the "settling" phase, which means the user has released it
        // we can't infer directionality from the scroll information, so we
        // track the offset changes. if the offset delta is consistent with
        // the existing direction during the settling phase, we can say for
        // certain where it's going and can fire
        // -prf
        if (scrollState.current === 'settling') {
          if (lastDirection.current === -1 && offset < lastOffset.current) {
            onPageSelecting?.(position)
            setSelectedPage(position)
            lastDirection.current = 0
          } else if (
            lastDirection.current === 1 &&
            offset > lastOffset.current
          ) {
            onPageSelecting?.(position + 1)
            setSelectedPage(position + 1)
            lastDirection.current = 0
          }
        } else {
          if (offset < lastOffset.current) {
            lastDirection.current = -1
          } else if (offset > lastOffset.current) {
            lastDirection.current = 1
          }
        }
        lastOffset.current = offset
      },
      [lastOffset, lastDirection, onPageSelecting],
    )

    const handlePageScrollStateChanged = React.useCallback(
      (e: PageScrollStateChangedNativeEvent) => {
        scrollState.current = e.nativeEvent.pageScrollState
        onPageScrollStateChanged?.(e.nativeEvent.pageScrollState)
      },
      [scrollState, onPageScrollStateChanged],
    )

    const onTabBarSelect = React.useCallback(
      (index: number) => {
        pagerView.current?.setPage(index)
        onPageSelecting?.(index)
      },
      [pagerView, onPageSelecting],
    )

    return (
      <View style={s.flex1}>
        {renderTabBar({
          selectedPage,
          onSelect: onTabBarSelect,
        })}
        <AnimatedPagerView
          style={s.flex1}
          ref={pagerView}
          scrollEnabled={scrollEnabled}
          initialPage={initialPage}
          onPageScrollStateChanged={handlePageScrollStateChanged}
          onPageScroll={onPageScroll}
          onPageSelected={onPageSelectedInner}>
          {children}
        </AnimatedPagerView>
      </View>
    )
  },
)

const styles = StyleSheet.create({})
