import React, { FC, useCallback, useState } from 'react'
import {
  FlatList,
  ListRenderItemInfo,
  Text,
  TextStyle,
  View,
  ViewStyle,
  StyleSheet,
} from 'react-native'

import version from '../../package.json'

import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { LogOut, Trash2Icon } from 'lucide-react-native'

import { useQueryClient } from '@tanstack/react-query'

import { accountRoutes } from '#/lib/config/account'

import { useNavigation } from '@react-navigation/native'
import { supabase } from '#/lib/supabase'
import {
  AllNavigatorParams,
  MyAccountTabNavigatorParams,
  NavigationProp,
} from '#/lib/routes/types'
import { useSession, useSessionApi } from '#/state/session'
import { useGlobalLoadingControls } from '#/state/shell/global-loading'
import { AccountNavigationItem } from '#/types/automate'
import { SectionItem } from '#/components/account/SectionItem'
import { useTheme } from '#/theme'
import { DeleteAccountModal } from '#/components/modals/DeleteAccountModal'
import * as notifications from '#/lib/notifications/notifications'
import { useCartStore } from '#/stores/cart'
import { useVehicleStore } from '#/stores/vehicle'
type Props = NativeStackScreenProps<MyAccountTabNavigatorParams, 'MyAccount'>

export const MyAccountScreen: FC<Props> = props => {
  const navigation = useNavigation<NavigationProp>()
  const [isOpen, setIsOpen] = useState(false)
  const { session } = useSession()
  const { logout } = useSessionApi()
  const t = useTheme()
  const queryClient = useQueryClient()

  const clearCartItem = useCartStore(state => state.clearItem)
  const clearVehicles = useVehicleStore(state => state.clearVehicles)
  const globalLoading = useGlobalLoadingControls()

  const handleLogout = useCallback(async () => {
    globalLoading.show()
    try {
      await notifications.remoteRegisteredFCMToken(session!)
      clearCartItem()
      clearVehicles()
      await logout()
    } catch (error) {}

    navigation.navigate('Home')

    globalLoading.hide()
  }, [queryClient, navigation])
  const onClosed = () => {
    setIsOpen(() => false)
  }
  const onOpen = () => {
    setIsOpen(() => true)
  }
  const onPressDeleteAccount = useCallback(async () => {
    onClosed()
    try {
      globalLoading.show()
      await logout()
      await supabase.rpc('delete_user')
    } catch (error) {
    } finally {
      setTimeout(() => navigation.navigate('Home'), 500)
      globalLoading.hide()
    }
  }, [handleLogout])

  const keyExtractor = (item: AccountNavigationItem) => item.id.toString()
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<AccountNavigationItem>) => {
      return (
        <SectionItem
          section={item}
          //@ts-ignore
          onPress={() => navigation.navigate(item?.name)}
          hasIconRight
        />
      )
    },
    [],
  )

  return (
    <>
      <View style={$root}>
        <View style={styles.flexCenter}>
          <View style={[styles.avatar]}>
            <Text style={[styles.greeting]}>
              {session?.user?.user_metadata?.first_name
                ? session?.user?.user_metadata?.first_name![0]?.toUpperCase()
                : 'A'}
            </Text>
          </View>
          <View style={{ flexDirection: 'column', gap: 5 }}>
            <Text style={$fullName}>
              {session?.user?.user_metadata?.full_name
                ? session?.user?.user_metadata?.full_name
                : session?.user?.user_metadata?.first_name
                ? `${session?.user?.user_metadata?.first_name} ${session?.user?.user_metadata?.last_name}`
                : 'N/A'}
            </Text>
            {session?.user?.email && (
              <Text style={$smallText}>{session?.user.email}</Text>
            )}
            {session?.user?.phone && (
              <Text style={$smallText}>{session?.user.phone}</Text>
            )}
          </View>
        </View>

        <View style={[styles.sectionItem, t.atoms.shadow_sm]}>
          <FlatList<AccountNavigationItem>
            data={accountRoutes}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={{
              gap: 20,
            }}
          />
        </View>
        <View style={[styles.sectionItem, { height: 60 }, t.atoms.shadow_sm]}>
          <SectionItem
            key={5}
            section={{
              id: 3,
              title: 'Sign Out',
              iconElement: <LogOut color="#000" />,
              subTitle: 'App Sign Out',
            }}
            onPress={handleLogout}
          />
        </View>
        <View
          style={[
            styles.sectionItem,
            { paddingVertical: 10, marginVertical: 0, height: 50 },
            t.atoms.shadow_sm,
          ]}>
          <SectionItem
            key={6}
            section={{
              id: 3,
              title: 'Delete account',
              iconElement: <Trash2Icon color="#B61616" />,
            }}
            textColor="#B61616"
            onPress={onOpen}
          />
        </View>
        <View style={styles.version}>
          <Text
            style={styles.versionText}>{`version v${version.version}`}</Text>
        </View>
      </View>
      <DeleteAccountModal
        isOpen={isOpen}
        onClosed={onClosed}
        onPressDeleteAccount={onPressDeleteAccount}
      />
    </>
  )
}

const $root: ViewStyle = {
  flex: 1,
  backgroundColor: '#fff',
}

const $fullName: TextStyle = {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#000',
  marginTop: 16,
  textAlign: 'center',
}

const $smallText: TextStyle = {
  fontSize: 12,
  color: '#625c58',
  textAlign: 'center',
}

const styles = StyleSheet.create({
  flexRow: {
    flexDirection: 'row',
  },
  flexCenter: { alignItems: 'center', justifyContent: 'center' },
  spacing: {
    marginVertical: 14,
  },
  avatar: {
    backgroundColor: '#b61616',
    aspectRatio: 1,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  sectionItem: {
    borderRadius: 10,
    marginVertical: 20,
    marginHorizontal: 16,

    padding: 18,
    backgroundColor: '#fff',
  },
  greeting: {
    fontWeight: '700',
    fontSize: 48,
    color: '#fff',
  },
  version: { flex: 1, justifyContent: 'flex-end', marginBottom: 10 },
  versionText: { alignSelf: 'center', color: '#625C58' },
})
