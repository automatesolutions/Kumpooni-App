import React, {FC, useLayoutEffect} from 'react'
import {ActivityIndicator, ScrollView, StyleSheet, View} from 'react-native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {CommonNavigatorParams, NavigationProp} from '#/lib/routes/types'
import {useSession} from '#/state/session'
import {useNavigation} from '@react-navigation/native'
import {colors, spacing} from '#/utils/theme'
import {useGetRepairOrderId} from '#/state/queries/order'
import {Header} from '#/components/Header'
import {Text} from '#/components/Typography'
import {
  convertRepairStatusText,
  getRepairOrderStatusColor,
} from '#/lib/functions'
import {atoms as a, useTheme} from '#/theme'
import {currency} from '#/lib/strings/currency'
import {ServiceAppointment} from '#/components/order/ServiceAppointment'
import {ServiceCenter} from '#/components/order/ServiceCenter'
import {RepairServices} from '#/components/order/RepairServices'
import {RepairParts} from '#/components/order/RepairParts'
import {OrderDetails} from '#/components/order/OrderDetails'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'OrderDetails'>

export function OrderDetailsScreen({route}: Props) {
  const {params} = route
  const {repairOrderId} = params

  const {session} = useSession()
  const navigation = useNavigation<NavigationProp>()

  const {data: repair_order, error: repairError} = useGetRepairOrderId({
    user_id: session?.user.id,
    repair_order_id: repairOrderId,
  })

  const isCancelled =
    repair_order?.status === 'Cancelled' ||
    repair_order?.status === 'In Progress'

  const isCompleted = repair_order?.status === 'Completed'

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      header: () => (
        <Header
          title={'Order Details'}
          leftIcon="back"
          titleStyle={{
            color: colors.black,
            fontWeight: 'bold',
            fontSize: 18,
            fontFamily: 'Inter-Bold',
          }}
          leftIconColor={colors.black}
          onLeftPress={() => navigation.goBack()}
        />
      ),
    })
  }, [])

  if (!repair_order)
    return (
      <ActivityIndicator
        size="large"
        color={'#b61616'}
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      />
    )

  return (
    <View style={styles.container}>
      <ScrollView>
        <ServiceAppointment
          appointment_date={repair_order?.appointment_date}
          appointment_time={repair_order?.appointment_time}
          vehicle={repair_order.vehicle}
          status={repair_order?.status}
        />

        <ServiceCenter store={repair_order?.store} />
        <View style={[styles.orderStatus, styles.flexBetween]}>
          <Text>Status</Text>
          <Text style={getRepairOrderStatusColor(repair_order.status)}>
            {convertRepairStatusText(repair_order.status)}
          </Text>
        </View>
        <View style={styles.serviceSummary}>
          <Text style={[a.font_bold]}>Order Summary</Text>
          <RepairServices services={repair_order?.services} priceRequired />
          {repair_order?.parts.length > 0 && (
            <>
              <Text style={[a.font_bold, {paddingTop: spacing.small}]}>
                Parts
              </Text>
              <RepairParts parts={repair_order?.parts} />
            </>
          )}

          <View style={{marginTop: 10}}>
            <View style={styles.trigger}>
              <Text style={[a.text_xs, a.font_bold, {color: colors.gray}]}>
                Sub total
              </Text>
              <Text style={[a.text_xs, a.font_bold, {color: colors.gray}]}>
                {currency.format(repair_order?.total_cost ?? 0)}
              </Text>
            </View>

            <View style={styles.trigger}>
              <Text style={[a.text_xs, a.font_bold]}>Total</Text>
              <Text style={[a.text_xs, a.font_bold]}>
                {currency.format(repair_order?.total_cost!)}
              </Text>
            </View>
          </View>
        </View>
        <OrderDetails
          referenceNo={repair_order.reference_no}
          created_at={repair_order?.created_at}
        />
      </ScrollView>
      {/* <View>
        {!isCompleted && !isCancelled && (
          <AppointmentAction
            id={repair_order?.id}
            user_id={session?.user?.id}
            appointment_date={repair_order?.appointment_date}
            created_at={repair_order?.created_at}
          />
        )}
      </View> */}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    height: 400,
    width: 400,
  },
  heading: {
    padding: spacing.medium,
  },
  reference: {
    padding: spacing.medium,
    backgroundColor: colors.gray500,
    justifyContent: 'center',
  },
  referenceText: {
    textTransform: 'uppercase',
  },
  body: {
    padding: spacing.medium,
  },

  serviceSummary: {
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.medium,

    borderBottomWidth: spacing.extraSmall,
    borderColor: colors.gray300,
  },

  trigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  serviceItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 5,
  },
  orderStatus: {
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.medium,
    borderBottomWidth: spacing.extraSmall,
    borderColor: colors.gray300,
  },
  flexBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})
