import React, { useCallback } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  ListRenderItem,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'

import { s, colors } from 'lib/styles'

import { useNavigation } from '@react-navigation/native'
import { MoreHorizontal, Trash2, TrashIcon } from 'lucide-react-native'
import { useSession } from '#/state/session'
import {
  useVehiclesDeleteMutation,
  useVehiclesQuery,
} from '#/state/queries/vehicle'
import { Vehicle } from '#/types/automate'
import { CenteredView } from '#/components/utils/Views'
import { Text } from '#/components/Typography'
import { shadows, spacing } from '#/utils/theme'
import { useVehicleStore } from '#/stores/vehicle'
import { NavigationProp } from '#/lib/routes/types'
import { useGlobalLoadingControls } from '#/state/shell/global-loading'
// import {
//   NativeDropdown,
//   DropdownItem as NativeDropdownItem,
// } from '#/components/util/forms/NativeDropdown'

export function CarsScreen() {
  const { session } = useSession()
  const {
    data: vehicles,
    isLoading,
    error: vehiclesError,
  } = useVehiclesQuery(session?.user.id!)

  const renderItem: ListRenderItem<Vehicle> = useCallback(({ item }) => {
    return <CarCard vehicle={item} />
  }, [])

  if (isLoading) {
    return (
      <CenteredView style={s.flexCenter}>
        <ActivityIndicator size="large" />
      </CenteredView>
    )
  }
  if (vehiclesError) {
    return (
      <CenteredView style={s.flexCenter}>
        <Text>Error</Text>
      </CenteredView>
    )
  }

  return (
    <View style={[{ backgroundColor: '#fff' }, styles.root]}>
      <Text style={styles.title}>
        {(vehicles?.length ?? 1) > 1 ? 'My Vehicles' : 'My Vehicle'}
      </Text>

      <FlatList
        //@ts-ignore
        data={vehicles}
        renderItem={renderItem}
        contentContainerStyle={{
          gap: 5,
        }}
        ListFooterComponent={<AddCarComp />}
        keyExtractor={item => `${item.id}`}
      />
    </View>
  )
}

function AddCarComp() {
  const navigation = useNavigation<NavigationProp>()

  return (
    <TouchableOpacity
      style={[styles.carCard, { marginBottom: 20 }]}
      onPress={() =>
        navigation.navigate('Vehicle', { isFirstVehicle: undefined })
      }>
      <View style={[styles.imageBox, { backgroundColor: colors.gray1 }]}>
        <Image
          source={{
            uri: 'https://vheyzzpdmmyiejsxerzg.supabase.co/storage/v1/object/public/image/add-car-placeholder.png?t=2024-02-05T03%3A38%3A09.738Z',
          }}
          style={{
            height: 70,
            width: 70,
          }}
          resizeMode="contain"
        />
      </View>
      <View style={{ flex: 1, justifyContent: 'center', marginTop: -10 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.red5,
            textTransform: 'uppercase',
          }}>
          Add a vehicle
        </Text>
      </View>
    </TouchableOpacity>
  )
}

function CarCard({ vehicle }: { vehicle: Vehicle }) {
  const navigation = useNavigation<NavigationProp>()
  const { mutate: deleteVehicleMutation } = useVehiclesDeleteMutation()
  const deleteVehicle = useVehicleStore(state => state.deleteVehicle)
  const onEdit = () => {
    navigation.navigate('Vehicle', { vehicle: vehicle })
  }

  const globalLoading = useGlobalLoadingControls()
  const onDelete = () => {
    globalLoading.show()
    deleteVehicleMutation(vehicle.id, {
      onSuccess() {
        deleteVehicle(vehicle.id)
      },
      onSettled() {
        globalLoading.hide()
      },
    })
  }

  // const dropdownitems: NativeDropdownItem[] = [
  //   {
  //     label: 'Edit',
  //     onPress: onEdit,
  //     testID: 'CarEdit',
  //     icon: {
  //       ios: {
  //         name: 'character.book.closed',
  //       },
  //       android: 'ic_menu_sort_alphabetically',
  //     },
  //   },
  //   {
  //     label: 'separator',
  //   },
  //   {
  //     label: 'Delete',
  //     onPress: onDelete,
  //     testID: 'Car Delete',
  //     icon: {
  //       ios: {
  //         name: 'character.book.closed',
  //       },
  //       android: 'ic_menu_sort_alphabetically',
  //     },
  //   },
  // ]

  return (
    <TouchableOpacity style={[styles.carCard]} disabled={true}>
      <View style={[styles.imageBox, { backgroundColor: colors.gray1 }]}>
        <Image
          source={{ uri: vehicle?.brand?.img_url! }}
          style={{
            height: 70,
            width: 70,
          }}
          resizeMode="contain"
        />
      </View>
      <View style={{ flex: 1, justifyContent: 'center', marginTop: -10 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '700',
          }}>{`${vehicle?.year_model} ${vehicle?.brand?.name}`}</Text>
        <Text>{`${vehicle?.model?.name} ${vehicle?.plate_no}`}</Text>
      </View>
      <View
        style={{
          gap: 6,
          paddingVertical: 7,
          paddingHorizontal: 14,
          marginLeft: 6,
          borderRadius: 5,
        }}>
        <TouchableOpacity onPress={onDelete}>
          <TrashIcon size={15} color={'#b61616'} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  title: {
    color: colors.black,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.25,
    alignSelf: 'center',
    paddingBottom: 5,
  },
  imageBox: {
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 2,
  },
  carCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 5,
    flex: 1,
    paddingVertical: 5,
    marginHorizontal: spacing.large,
    marginVertical: 2,
    ...shadows.semiLight,
  },
})
