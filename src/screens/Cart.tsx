import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from 'react-native'
import {useNavigation} from '@react-navigation/native'

import {CartItem} from '#/components/cart/CartItem'
import {Pager, PagerRef} from '#/components/pager'
import {LoginModal} from '#/components/modals/LoginModal'
import {CarRequiredModal} from '#/components/modals/CarRequiredModal'
import {SegmentedControls} from '#/components/SegmentedControls'
import {shadows} from '#/utils/theme'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {
  BottomSheetModal,
  BottomSheetModalInstance,
} from '#/components/BottomSheetModal'
import {useSession} from 'state/session'
import {useVehiclesQuery} from 'state/queries/vehicle'
import {useVehicleStore} from '#/stores/vehicle'
import {CartStoreItem, useCartStore, useIsCarRequired} from '#/stores/cart'
import {atoms as a, useTheme} from '#/theme'
import {s} from 'lib/styles'
import {NavigationProp} from 'lib/routes/types'
import {Text} from '#/components/Typography'
import {color} from '#/theme/tokens'
import * as Toggle from '#/components/forms/Toggle'

export function CartScreen() {
  const [isOpen, setIsOpen] = useState(false)
  const pagerRef = useRef<PagerRef>(null)

  const t = useTheme()
  const {carts} = useCartStore(state => ({
    carts: state.items,
  }))
  const setSelectedVehicle = useVehicleStore(state => state.setSelectedVehicle)
  const {session} = useSession()
  const {data: vehicles} = useVehiclesQuery(session?.user.id!)
  const {setServiceIds} = useCartStore(state => ({
    setServiceIds: state.setServiceIds,
  }))
  const selectedVehicle = useVehicleStore(state => state.selectedVehicle)
  const navigation = useNavigation<NavigationProp>()

  const [homeService, maintenance] = useMemo(() => {
    return carts.reduce<[CartStoreItem[], CartStoreItem[]]>(
      (result, storeCart) => {
        if (
          storeCart.service_type === 'Home Service' ||
          storeCart.service_type === 'OrderDelivery'
        ) {
          result[0].push(storeCart)
        } else {
          result[1].push(storeCart)
        }
        return result
      },
      [[], []],
    )
  }, [carts])

  const closeModal = useCallback(() => {
    setIsOpen(() => false)
  }, [])

  const bottomSheetRef = useRef<BottomSheetModalInstance>(null)
  const initialSnapPoints = useMemo(() => ['35%'], [])
  const handleSheetChanges = useCallback((index: number) => {}, [])
  const handleDismiss = useCallback(() => {
    bottomSheetRef?.current?.dismiss()
  }, [])

  const onPressQuote = useCallback(
    (servicesIds: string[], isCarRequired: boolean) => {
      if (!session) {
        bottomSheetRef?.current?.present()
        return
      }
      console.log('isCarRequired', isCarRequired)

      if (isCarRequired && vehicles?.length === 0) {
        setIsOpen(() => true)
        return
      }
      const newServiceIds = servicesIds.map(id => Number(id))
      setServiceIds(newServiceIds)

      navigation.navigate('StoreSelection')
    },
    [navigation, session, vehicles],
  )

  useEffect(() => {
    if (vehicles!?.length > 0 && !selectedVehicle) {
      //@ts-ignore
      setSelectedVehicle(vehicles[0])
    }
  }, [vehicles])

  useEffect(() => {
    if (maintenance.length === 0) {
      pagerRef.current?.setPage(1)
    } else {
      pagerRef.current?.setPage(0)
    }
  }, [])

  return (
    <View style={[t.atoms.bg, {flex: 1}]}>
      <Pager
        ref={pagerRef}
        initialPage={0}
        scrollEnabled={false}
        renderTabBar={props => (
          <SegmentedControls
            options={['In-Store', 'Home Service']}
            selectedOption={props.selectedPage}
            onOptionPress={props.onSelect}
            style={{
              marginVertical: 10,
              alignSelf: 'center',
            }}
          />
          // <Text>Hello World</Text>
        )}>
        <View style={{flex: 1}}>
          <MaintenanceService
            maintenance={maintenance}
            name="in store"
            onPress={onPressQuote}
          />
        </View>
        <View>
          <MaintenanceService
            maintenance={homeService}
            name="home service"
            onPress={onPressQuote}
          />
        </View>
      </Pager>

      <CarRequiredModal isOpen={isOpen} closeModal={closeModal} />
      <BottomSheetModal
        style={{paddingHorizontal: 16}}
        ref={bottomSheetRef}
        index={0}
        //@ts-ignore
        snapPoints={initialSnapPoints}
        handleIndicatorStyle={{
          width: 60,
          backgroundColor: '#D9D9D9',
          height: 6,
        }}
        onChange={handleSheetChanges}
        keyboardBehavior="fillParent"
        enableDynamicSizing
        children={<LoginModal handleDismiss={handleDismiss} />}
      />
    </View>
  )
}

export function MaintenanceService({
  maintenance,
  name,
  onPress,
}: {
  maintenance: CartStoreItem[]
  name: 'home service' | 'in store'
  onPress: (selectedIds: string[], isCarRequired: boolean) => void
}) {
  const t = useTheme()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isEditing, setIsEditing] = useState(false)

  const [all, setAll] = useState(false)

  const navigation = useNavigation<NavigationProp>()
  const isCarRequired = useIsCarRequired(maintenance)
  const {bulkDelete, setServiceIds} = useCartStore(state => ({
    bulkDelete: state.bulkDeleteItem,
    setServiceIds: state.setServiceIds,
  }))

  const onPressEditing = useCallback(() => {
    if (isEditing) {
      setAll(false)
    }
    setIsEditing(!isEditing)
  }, [isEditing])

  const onPressSelectAll = useCallback(() => {
    const allIds = maintenance.map(cart => `${cart.id}`)
    if (all) {
      setSelectedIds([])

      setAll(prev => !prev)
      return
    } else {
      setSelectedIds(allIds)
    }

    setAll(prev => !prev)
  }, [all, selectedIds, maintenance])

  const onPressBulkDelete = useCallback(() => {
    const numSelectedIds = selectedIds.map(Number)
    bulkDelete(numSelectedIds)
    setIsEditing(false)
  }, [selectedIds, bulkDelete])

  const handleOnGetQuote = () => {
    onPress(selectedIds, isCarRequired)
  }

  if (maintenance.length === 0) {
    return (
      <View style={{flex: 1, paddingTop: 250, alignItems: 'center'}}>
        <Text
          style={[
            a.text_lg,
            a.font_bold,
          ]}>{`Your cart for ${name} is empty`}</Text>

        <Pressable
          style={{
            backgroundColor: color.gray_100,
            borderRadius: 999,
            marginTop: 20,
            paddingVertical: 7,
            paddingHorizontal: 10,
          }}
          onPress={() => navigation.navigate('HomeTab')}>
          <Text style={[a.font_bold, a.text_md]}>Add services</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View
      style={{
        flex: 1,
        // justifyContent: 'space-between',
      }}>
      <ScrollView style={{flex: 1}}>
        <CartHeader isEditing={isEditing} onPressEditing={onPressEditing} />
        <Toggle.Group
          values={selectedIds}
          onChange={setSelectedIds}
          label="Select your selected cart">
          <View style={{gap: 8, marginVertical: 10}}>
            {maintenance.map(cart => (
              <View
                key={cart.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 5,
                  paddingHorizontal: 16,
                  gap: 20,
                }}>
                <Toggle.Item
                  key={cart.id}
                  name={`${cart.id}`}
                  label={`${cart.name}`}>
                  <Toggle.Checkbox />
                </Toggle.Item>
                <CartItem {...cart} />
              </View>
            ))}
          </View>
        </Toggle.Group>
      </ScrollView>
      <View style={styles.summaryContainer}>
        {isEditing ? (
          <View
            style={[
              s.flexRow,
              {justifyContent: 'space-between', alignItems: 'center'},
            ]}>
            <Pressable
              onPress={onPressSelectAll}
              style={[s.flexRow, {gap: 10, justifyContent: 'center'}]}>
              <View
                style={[
                  {
                    width: 22,
                    height: 22,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: 4,
                    borderWidth: 1,
                    flexDirection: 'row',
                    backgroundColor: all ? color.blue_500 : color.gray_0,
                    borderColor: all ? color.blue_600 : '#808285',
                  },
                ]}>
                {all && <Check size="sm" fill={'#fff'} />}
              </View>
              <Text style={[a.text_md]}>All</Text>
            </Pressable>
            <TouchableOpacity
              onPress={onPressBulkDelete}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderWidth: 1,
                borderColor: color.red_500,
                borderRadius: 4,
              }}>
              <Text style={{color: color.red_500, fontWeight: '600'}}>
                Remove
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity
              disabled={selectedIds.length > 0 ? false : true}
              style={[
                styles.getQuoteBtn,
                {
                  opacity: selectedIds.length > 0 ? 1 : 0.5,
                },
              ]}
              onPress={handleOnGetQuote}
              accessibilityRole="button">
              <Text style={[styles.btnText]}>Get A Quote</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  )
}

export function CartHeader({
  isEditing,
  onPressEditing,
}: {
  isEditing: boolean
  shopName?: string
  onPressEditing: () => void
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        borderBottomWidth: 0.5,
        borderColor: color.gray_200,
        paddingBottom: 5,
        paddingHorizontal: 12,
      }}>
      <TouchableOpacity
        style={{justifyContent: 'flex-end'}}
        onPress={onPressEditing}>
        <Text style={[isEditing ? {color: color.blue_500} : {color: '#000'}]}>
          {isEditing ? 'Done' : 'Edit'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}
const styles = StyleSheet.create({
  summaryContainer: {
    paddingHorizontal: 12,
    paddingVertical: 18,
    backgroundColor: '#fff',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    width: '100%',

    ...shadows.dark,
  },
  getQuoteBtn: {
    marginHorizontal: 16,
    marginBottom: 5,
    paddingVertical: 10,
    borderRadius: 5,
    backgroundColor: '#000',
  },
  btnText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },

  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    paddingVertical: 10,
  },
  price: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
})
