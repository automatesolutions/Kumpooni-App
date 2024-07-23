import React, {ComponentProps, useLayoutEffect} from 'react'
import {GestureResponderEvent, TouchableOpacity, View} from 'react-native'
import Animated from 'react-native-reanimated'
import {styles} from './BottomBarStyles'
import {
  HomeIcon,
  HomeIconSolid,
  MyAccountIcon,
  MyAccountIconSolid,
  OrdersIcon,
  OrdersIconSolid,
  PartsIcon,
  PartsIconSolid,
  StoreIcon,
  StoreIconSolid,
} from 'lib/icons'
import {BottomTabBarProps} from '@react-navigation/bottom-tabs'
import {useNavigationTabState} from '#/lib/hooks/useNavigationTabState'
import {TabState, getTabState} from '#/lib/routes/helpers'
import {StackActions} from '@react-navigation/native'
import {useDedupe} from '#/lib/hooks/useDedupe'
import {Text} from '../Typography'
import {useTheme, atoms as a} from '#/theme'
import {useSession} from '#/state/session'

type TabOptions = 'Home' | 'Orders' | 'Parts' | 'Shops' | 'MyAccount'
interface BtnProps
  extends Pick<
    ComponentProps<typeof TouchableOpacity>,
    | 'accessible'
    | 'accessibilityRole'
    | 'accessibilityHint'
    | 'accessibilityLabel'
  > {
  testID?: string
  icon: JSX.Element
  label: string
  isActive: boolean
  notificationCount?: string
  onPress?: (event: GestureResponderEvent) => void
  onLongPress?: (event: GestureResponderEvent) => void
}
export function BottomBar({navigation}: BottomTabBarProps) {
  const dedupe = useDedupe()
  const {hasSession} = useSession()

  const {isAtHome, isAtOrders, isAtParts, isAtShops, isAtMyAccount} =
    useNavigationTabState()

  const hideBottomBar = (isAtOrders || isAtShops || isAtParts) && !hasSession

  const onPressTab = React.useCallback(
    (tab: TabOptions) => {
      const state = navigation.getState()

      const tabState = getTabState(state, tab)

      if (tabState === TabState.InsideAtRoot) {
      } else if (tabState === TabState.Inside) {
        dedupe(() => navigation.dispatch(StackActions.popToTop()))
      } else {
        dedupe(() => navigation.navigate(`${tab}Tab`))
      }
    },
    [navigation, dedupe],
  )
  const onPressHome = React.useCallback(() => onPressTab('Home'), [onPressTab])
  const onPressOrders = React.useCallback(
    () => onPressTab('Orders'),
    [onPressTab],
  )
  const onPressStore = React.useCallback(
    () => onPressTab('Shops'),
    [onPressTab],
  )
  const onPressMyAccount = React.useCallback(
    () => onPressTab('MyAccount'),
    [onPressTab],
  )

  const onPressParts = React.useCallback(
    () => onPressTab('Parts'),
    [onPressTab],
  )

  return (
    <Animated.View
      style={[
        styles.bottomBar,
        {
          paddingBottom: 2,
          display: isAtMyAccount || hideBottomBar ? 'none' : 'flex',
        },
      ]}>
      <Btn
        testID="bottomBarHomeBtn"
        label="Home"
        isActive={isAtHome}
        icon={
          isAtHome ? (
            <HomeIconSolid
              strokeWidth={4}
              size={24}
              style={[styles.ctrlIcon, {color: '#b61616'}, styles.homeIcon]}
            />
          ) : (
            <HomeIcon
              strokeWidth={4}
              size={24}
              style={[styles.ctrlIcon, {color: '#625C58'}, styles.homeIcon]}
            />
          )
        }
        onPress={onPressHome}
        accessibilityRole="tab"
        accessibilityLabel={`Home`}
        accessibilityHint=""
      />
      <Btn
        testID="bottomBarHomeBtn"
        label="Orders"
        isActive={isAtOrders}
        icon={
          isAtOrders ? (
            <OrdersIconSolid
              strokeWidth={0.1}
              size={24}
              style={[styles.ctrlIcon, {color: '#b61616'}, styles.orderIcon]}
            />
          ) : (
            <OrdersIcon
              strokeWidth={0.3}
              size={24}
              style={[styles.ctrlIcon, {color: '#625C58'}, styles.orderIcon]}
            />
          )
        }
        onPress={onPressOrders}
        accessibilityRole="tab"
        accessibilityLabel={`Orders`}
        accessibilityHint=""
      />
      <Btn
        testID="bottomBarHomeBtn"
        label="Parts"
        isActive={isAtParts}
        icon={
          isAtParts ? (
            <PartsIconSolid
              strokeWidth={4}
              size={24}
              style={[styles.ctrlIcon, {color: '#b61616'}]}
            />
          ) : (
            <PartsIcon
              size={24}
              style={[styles.ctrlIcon, {color: '#625C58'}, styles.homeIcon]}
            />
          )
        }
        onPress={onPressParts}
        accessibilityRole="tab"
        accessibilityLabel={`Home`}
        accessibilityHint=""
      />
      <Btn
        testID="bottomBarHomeBtn"
        label="Shops"
        isActive={isAtShops}
        icon={
          isAtShops ? (
            <StoreIconSolid
              strokeWidth={23}
              size={24}
              style={[styles.ctrlIcon, {color: '#b61616'}, styles.orderIcon]}
            />
          ) : (
            <StoreIcon
              strokeWidth={1.8}
              size={24}
              style={[styles.ctrlIcon, {color: '#625C58'}, styles.orderIcon]}
            />
          )
        }
        onPress={onPressStore}
        accessibilityRole="tab"
        accessibilityLabel={`Store`}
        accessibilityHint=""
      />
      <Btn
        testID="bottomBarHomeBtn"
        label="Profile"
        isActive={isAtMyAccount}
        icon={
          isAtMyAccount ? (
            <MyAccountIconSolid
              strokeWidth={2}
              size={25}
              style={[styles.ctrlIcon, {color: '#b61616'}, styles.accountIcon]}
            />
          ) : (
            <MyAccountIcon
              strokeWidth={2}
              size={25}
              style={[styles.ctrlIcon, {color: '#625C58'}, styles.accountIcon]}
            />
          )
        }
        onPress={onPressMyAccount}
        accessibilityRole="tab"
        accessibilityLabel={`MyAccount`}
        accessibilityHint=""
      />
    </Animated.View>
  )
}

function Btn({
  testID,
  icon,
  notificationCount,
  onPress,
  onLongPress,
  accessible,
  accessibilityHint,
  accessibilityLabel,
  isActive,
  label,
}: BtnProps) {
  return (
    <TouchableOpacity
      testID={testID}
      style={styles.ctrl}
      onPress={onLongPress ? onPress : undefined}
      onPressIn={onLongPress ? undefined : onPress}
      onLongPress={onLongPress}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}>
      {notificationCount ? (
        <View style={[styles.notificationCount]}>
          <Text style={styles.notificationCountLabel}>{notificationCount}</Text>
        </View>
      ) : undefined}
      {icon}
      <Text
        style={[
          a.text_center,
          a.text_xs,
          isActive ? a.font_bold : a.font_normal,
          {color: isActive ? '#b61616' : '#625C58'},
        ]}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}
