import React, {FC, useMemo, useState} from 'react'
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
} from 'react-native'

import {Controller, SubmitHandler, useForm} from 'react-hook-form'
import {z} from 'zod'
import {zodResolver} from '@hookform/resolvers/zod'
import dayjs from 'dayjs'

import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {vehicleFormSchema} from '#/lib/validations/user'
import {CommonNavigatorParams, NavigationProp} from '#/lib/routes/types'
import {useSession} from '#/state/session'
import {useNavigation} from '@react-navigation/native'
import {useGlobalLoadingControls} from '#/state/shell/global-loading'
import {useVehicleStore} from '#/stores/vehicle'
import {useGetBrands, useGetModels} from '#/state/queries/cars'
import {
  useVehiclesAddMutation,
  useVehiclesEditMutation,
} from '#/state/queries/vehicle'
import {Select} from '#/components/select/Select'
import {colors} from '#/utils/theme'
import {logger} from '#/logger'

type Inputs = z.infer<typeof vehicleFormSchema>
type VehicleScreenProps = NativeStackScreenProps<
  CommonNavigatorParams,
  'Vehicle'
>
export function VehicleScreen({route}: VehicleScreenProps) {
  const vehicle = route.params?.vehicle
  const {session} = useSession()
  const navigation = useNavigation<NavigationProp>()
  const globalLoading = useGlobalLoadingControls()
  const defaultValues = useMemo(() => {
    return {
      id: vehicle?.id ?? '',
      brand_id: vehicle?.brand?.id ?? 0,
      model_id: vehicle?.model?.id ?? 0,
      year_model: vehicle?.year_model ?? '',
      plate_no: vehicle?.plate_no ?? '',
    }
  }, [route.params])
  const redirect = route.params?.redirect
  const addVehicle = useVehicleStore(state => state.addVehicle)
  const editVehicle = useVehicleStore(state => state.editVehicle)

  const {control, handleSubmit, watch} = useForm({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues,
  })

  const {brand_id: brandWatch, model_id: modelWatch} = watch()
  const {data: brands, isLoading} = useGetBrands()
  const {data: models} = useGetModels(brandWatch)

  const addVehicleMutation = useVehiclesAddMutation()
  const editVehicleMutation = useVehiclesEditMutation()
  const setSelectedVehicle = useVehicleStore(state => state.setSelectedVehicle)

  const currentYear = dayjs().year()

  const years: number[] = []
  for (let year = currentYear; year >= 1990; year--) {
    years.push(year)
  }

  const onSubmit: SubmitHandler<Inputs> = async data => {
    globalLoading.show()
    if (vehicle) {
      console.log('editVehicle')
      editVehicleMutation.mutate(
        {
          ...data,
          userId: session?.user?.id!,
        },
        {
          onSuccess: data => {
            editVehicle(data)
            setSelectedVehicle(data)
            navigation.goBack()
          },
          onSettled: () => {
            globalLoading.hide()
          },
        },
      )
      return
    }
    console.log('addVehicle')
    addVehicleMutation.mutate(
      {...data, userId: session?.user?.id!},
      {
        onSuccess: data => {
          addVehicle(data)
          setSelectedVehicle(data)
          if (redirect) {
            navigation.navigate(redirect)
            return
          }
          navigation.navigate('Home')
        },
        onSettled: () => {
          globalLoading.hide()
        },
        onError: e => {
          logger.error('Failed to insert data', {message: e})
        },
      },
    )
    return
  }

  if (isLoading)
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color={'#b61616'} />
      </View>
    )

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.instruction}>
        Please fill up the information needed
      </Text>

      <View style={styles.formWrapper}>
        <Controller
          control={control}
          name="brand_id"
          render={({
            field: {value, onChange},
            fieldState: {invalid, error},
          }) => {
            return (
              <View style={styles.formController}>
                <Text style={styles.label}>Brand</Text>
                <Select<number>
                  onChange={onChange}
                  value={value}
                  placeholder="Select Brand"
                  invalid={invalid}
                  options={brands?.map((item: {id: number; name: string}) => ({
                    label: item.name,
                    value: item.id,
                  }))}
                />
              </View>
            )
          }}
        />

        <Controller
          control={control}
          name="model_id"
          render={({field: {value, onChange}, fieldState: {invalid}}) => {
            return (
              <View style={styles.formController}>
                <Text style={styles.label}>Model</Text>
                <Select
                  onChange={onChange}
                  value={value}
                  placeholder="Select Model"
                  //@ts-ignore
                  options={models?.map(item => ({
                    label: item.name,
                    value: item.id,
                  }))}
                  disabled={!brandWatch}
                  invalid={invalid}
                />
              </View>
            )
          }}
        />
        <Controller
          control={control}
          name="year_model"
          render={({field: {value, onChange}, fieldState: {invalid}}) => {
            return (
              <View style={styles.formController}>
                <Text style={styles.label}>Year</Text>
                <Select
                  onChange={onChange}
                  value={value}
                  placeholder="Select Year"
                  disabled={!modelWatch}
                  options={years.map((item, index) => {
                    return {
                      label: `${item}`,
                      value: `${item}`,
                    }
                  })}
                  invalid={invalid}
                />
              </View>
            )
          }}
        />
        <Controller
          control={control}
          render={({
            field: {value, onChange, onBlur},
            fieldState: {invalid},
          }) => {
            return (
              <View style={styles.formController}>
                <Text style={styles.label}>{`Plate No.`}</Text>

                <View
                  style={[
                    styles.picker,
                    {borderColor: invalid ? '#ff0000' : '#625C58'},
                  ]}>
                  <TextInput
                    placeholder="Plate Number"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    maxLength={15}
                    style={[styles.input]}
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            )
          }}
          name="plate_no"
        />
        <Pressable
          onPress={handleSubmit(onSubmit)}
          style={({pressed}) => [styles.button, {opacity: pressed ? 0.7 : 1}]}
          accessibilityRole="button"
          accessibilityLabel={`Submit your car information`}
          accessibilityHint="">
          <Text style={styles.textBtn}> Submit </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  instruction: {
    color: '#625C58',
    fontSize: 14,
    fontWeight: '600',
    paddingBottom: 8,
    marginHorizontal: 16,
  },

  button: {
    marginTop: 'auto',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 8,
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderRadius: 5,
    backgroundColor: '#1E1E1E',
  },
  textBtn: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  input: {
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#000',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#625C58',
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 1,
    color: '#000',
    marginBottom: 2,
  },
  helperText: {
    marginTop: -5,
    marginHorizontal: 16,
    color: colors.primary,
    fontSize: 13,
  },
  formController: {
    marginHorizontal: 16,
  },
  formWrapper: {
    flex: 1,
    gap: 5,
  },
})
