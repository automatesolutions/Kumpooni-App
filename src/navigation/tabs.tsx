import React from 'react'
import {Platform} from 'react-native'
import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs'
import {Header} from '#/components/Header'
import {BottomBar} from '#/components/bottom-bar/BottomBar'
import {useTheme} from '#/theme'
import {
  BottomTabNavigatorParams,
  MyAccountTabNavigatorParams,
  OrdersTabNavigatorParams,
  PartsTabNavigatorParams,
  ShopTabNavigatorParams,
} from '#/lib/routes/types'
import {createNativeStackNavigatorWithAuth} from '#/view/shell/createNativeStackNavigatorWithAuth'
import {isAndroid} from '#/platform/detection'
import {HomeScreen} from '#/screens/Home'
import {OrderScreen} from '#/screens/Orders'
import {ShopsScreen} from '#/screens/Shops'
import {MyAccountScreen} from '#/screens/MyAccount'
import {PartsScreen} from '#/screens/Parts'
import {colors} from '#/lib/styles'
import {atoms as a} from '#/theme'
const Tab = createBottomTabNavigator<BottomTabNavigatorParams>()
const HomeTab = createNativeStackNavigatorWithAuth()
const OrdersTab = createNativeStackNavigatorWithAuth<OrdersTabNavigatorParams>()
const PartsTab = createNativeStackNavigatorWithAuth<PartsTabNavigatorParams>()
const ShopTab = createNativeStackNavigatorWithAuth<ShopTabNavigatorParams>()
const MyAccountTab =
  createNativeStackNavigatorWithAuth<MyAccountTabNavigatorParams>()
export function TabsNavigator() {
  const tabBar = React.useCallback(
    (props: JSX.IntrinsicAttributes & BottomTabBarProps) => (
      <BottomBar {...props} />
    ),
    [],
  )

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      backBehavior="initialRoute"
      screenOptions={{headerShown: false, lazy: true}}
      tabBar={tabBar}>
      <Tab.Screen name="HomeTab" getComponent={() => HomeTabNavigator} />
      <Tab.Screen
        name="OrdersTab"
        getComponent={() => OrdersTabNavigator}
        options={{
          tabBarStyle: {
            display: 'none',
            flex: 0,
          },
        }}
      />
      <Tab.Screen name="PartsTab" getComponent={() => PartsTabNavigator} />
      <Tab.Screen name="ShopsTab" getComponent={() => ShopTabNavigator} />
      <Tab.Screen
        name="MyAccountTab"
        options={{
          tabBarStyle: {
            display: 'none',
            backgroundColor: 'red',
            flex: 0,
          },
          headerShown: false,
        }}
        getComponent={() => MyAccountTabNavigator}
      />
    </Tab.Navigator>
  )
}

function PartsTabNavigator() {
  const t = useTheme()
  return (
    <PartsTab.Navigator
      screenOptions={({route, navigation}) => {
        return {
          headerShown: true,
          headerShadowVisible: true,
          animationEnabled: true,

          title: 'Parts',
          fullScreenGestureEnabled: true,
          animation:
            Platform.OS === 'android' ? 'fade_from_bottom' : 'simple_push',
          animationDuration: Platform.OS === 'ios' ? 400 : undefined,
          statusBarAnimation: 'fade',
          statusBarStyle: 'auto',
          header: ({options}) => (
            <Header
              title={options.title}
              titleStyle={{
                color: colors.black,
                fontFamily: 'Inter-Bold',
                fontSize: 17,
              }}
              backgroundColor={t.atoms.bg_contrast_25.backgroundColor}
              leftIcon="back"
              leftIconColor={colors.black}
              onLeftPress={() => {
                return route.name === 'Parts'
                  ? navigation.goBack()
                  : navigation.popToTop()
              }}
            />
          ),
        }
      }}>
      <PartsTab.Screen
        name="Parts"
        getComponent={() => PartsScreen}
        options={{
          requireAuth: true,
        }}
      />
    </PartsTab.Navigator>
  )
}
function HomeTabNavigator() {
  const t = useTheme()
  return (
    <HomeTab.Navigator
      screenOptions={{
        animation: isAndroid ? 'none' : undefined,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerShown: false,
        animationDuration: 250,
        contentStyle: t.atoms.bg,
      }}>
      <HomeTab.Screen name="Home" getComponent={() => HomeScreen} />
    </HomeTab.Navigator>
  )
}

function OrdersTabNavigator() {
  const t = useTheme()
  return (
    <OrdersTab.Navigator
      screenOptions={{
        animation: isAndroid ? 'none' : undefined,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerShown: false,
        animationDuration: 250,
        contentStyle: t.atoms.bg,
      }}>
      <OrdersTab.Screen
        name="Orders"
        getComponent={() => OrderScreen}
        options={{requireAuth: true}}
      />
    </OrdersTab.Navigator>
  )
}

function ShopTabNavigator() {
  const t = useTheme()
  return (
    <ShopTab.Navigator
      screenOptions={{
        animation: isAndroid ? 'none' : undefined,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerShown: false,
        animationDuration: 250,
        contentStyle: t.atoms.bg,
      }}>
      <ShopTab.Screen
        name="Shops"
        getComponent={() => ShopsScreen}
        options={{requireAuth: true, title: ''}}
      />
    </ShopTab.Navigator>
  )
}

function MyAccountTabNavigator() {
  const t = useTheme()
  return (
    <MyAccountTab.Navigator
      screenOptions={({route, navigation}) => {
        return {
          headerShown: true,
          headerShadowVisible: true,
          animationEnabled: true,
          fullScreenGestureEnabled: true,
          animation:
            Platform.OS === 'android' ? 'fade_from_bottom' : 'simple_push',
          animationDuration: Platform.OS === 'ios' ? 400 : undefined,
          statusBarAnimation: 'fade',
          statusBarStyle: 'auto',
          header: ({options}) => (
            <Header
              title={options.title}
              titleStyle={{
                color: colors.black,
                fontWeight: '700',
                fontFamily: 'Inter-Bold',
                fontSize: 18,
                textTransform: 'uppercase',
              }}
              leftIcon="back"
              leftIconColor={colors.black}
              onLeftPress={() => {
                return route.name === 'MyAccount'
                  ? navigation.goBack()
                  : navigation.popToTop()
              }}
            />
          ),
        }
      }}>
      <MyAccountTab.Screen
        name="MyAccount"
        getComponent={() => MyAccountScreen}
        options={{
          requireAuth: true,
        }}
      />
    </MyAccountTab.Navigator>
  )
}
