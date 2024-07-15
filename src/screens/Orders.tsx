import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useLayoutEffect,
  useState,
} from 'react'
import {
  TextStyle,
  View,
  ViewStyle,
  FlatList,
  ActivityIndicator,
  ListRenderItemInfo,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { TransactionTabTypes, tabs } from '#/lib/constants'
import { Header } from '../components/Header'
import { useRepairOrderQueryV2 } from '#/state/queries/appointment'
import { TransactionOrderTypes } from '../types/automate'
import { OrderItem } from '#/components/order/OrderItem'
import { Separator } from '#/components/utils/Views'
import { colors, spacing } from '#/utils/theme'
import { OrdersTabNavigatorParams } from '#/lib/routes/types'
import { Text } from '#/components/Typography'

type Props = NativeStackScreenProps<OrdersTabNavigatorParams, 'Orders'>

export function OrderScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState(tabs[0].key)

  const {
    data: transactions,
    refetch,
    isRefetching,
    isLoading,
  } = useRepairOrderQueryV2(activeTab)

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      header: () => (
        <Header
          title="Order History"
          leftIcon="back"
          titleStyle={$header}
          leftIconColor={colors.black}
          onLeftPress={() => navigation.goBack()}
        />
      ),
    })
  }, [])

  const renderTransactionItem = useCallback(
    ({ item }: ListRenderItemInfo<TransactionOrderTypes>) => {
      return <OrderItem transaction={item} />
    },
    [],
  )

  return (
    <View style={$root}>
      <TransactionTab activeTab={activeTab} setActiveTab={setActiveTab} />
      {isLoading ? (
        <ActivityIndicator size={'large'} color="red" style={{ flex: 1 }} />
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            //@ts-ignore
            data={transactions}
            renderItem={renderTransactionItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={{
              gap: 10,
            }}
            stickyHeaderIndices={[0]}
            ListEmptyComponent={
              <EmptyTransaction message="There are no available item yet." />
            }
            ListHeaderComponent={() => (
              <>
                <Separator />
              </>
            )}
            ListHeaderComponentStyle={{
              backgroundColor: '#fff',
              paddingVertical: 5,
              zIndex: 1,
            }}
            ItemSeparatorComponent={() => <Separator />}
            ListFooterComponent={
              <Separator style={{ height: 50, backgroundColor: '#fff' }} />
            }
            refreshControl={
              <RefreshControl
                onRefresh={refetch}
                refreshing={isRefetching}
                tintColor={colors.palette.neutral100}
              />
            }
          />
        </View>
      )}
    </View>
  )
}

export function TransactionTab({
  activeTab,
  setActiveTab,
}: {
  activeTab: string
  setActiveTab: Dispatch<SetStateAction<TransactionTabTypes>>
}) {
  return (
    <View style={$tabHeader}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.key
        const color = isActive ? '#000' : '#625C58'
        const weight = isActive ? '600' : 'normal'
        const border: ViewStyle = isActive
          ? { borderColor: colors.primary, borderBottomWidth: 2 }
          : { borderWidth: 0 }
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[border, { paddingBottom: 4 }]}>
            <Text style={{ color, fontWeight: weight }}>{tab.label}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

export function EmptyTransaction({ message }: { message: string }) {
  return (
    <View
      style={{
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
      }}>
      <Text style={{ textAlign: 'center', fontWeight: '400', fontSize: 16 }}>
        {message}
      </Text>
    </View>
  )
}
const $root: ViewStyle = {
  flex: 1,
  backgroundColor: '#fff',
}

const $header: TextStyle = {
  color: colors.black,
  fontWeight: 'bold',
  fontSize: 16,
  fontFamily: 'Inter-Bold',
}

const $title: TextStyle = {
  paddingBottom: spacing.micro,
  paddingLeft: spacing.medium,
}

const $tabHeader: ViewStyle = {
  backgroundColor: '#fff',
  width: '100%',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-around',
  paddingHorizontal: spacing.extraSmall,
  paddingVertical: 5,
}
