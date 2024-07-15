// import React from 'react'
// import { SafeAreaView, StyleSheet, View } from 'react-native'
// import { Button } from '../../components/button'

// import dayjs from 'dayjs'
// import utc from 'dayjs/plugin/utc'
// import { useNavigation } from '@react-navigation/native'
// import { updateRepairMutation } from '#/state/queries/order'
// import { spacing } from '#/utils/theme'

// dayjs.extend(utc)

// export function AppointmentAction({
//   id,
//   user_id,
//   appointment_date,
//   created_at,
// }: {
//   id: string
//   user_id: string | undefined
//   appointment_date: string | null
//   created_at: string | null
// }) {
//   const navigation = useNavigation()
//   const mutation = updateRepairMutation()
//   const cancelAppointment = () => {
//     mutation.mutate(
//       { user_id: user_id!, id: id! },
//       {
//         onSuccess: () => {
//           //@ts-ignore
//           navigation.navigate('Transactions')
//         },
//       },
//     )
//   }

//   const currentDate = new Date()
//   const currentUnix = dayjs().utc().unix()
//   const dbCreateAtUnix = dayjs(created_at!).unix()
//   const convertToMinute = (currentUnix - dbCreateAtUnix) / 60
//   const isOver30Min = convertToMinute > 30
//   const appointmentDate = new Date(appointment_date!)
//   const timeDifference = appointmentDate.getTime() - currentDate.getTime()
//   const daysDifference = timeDifference / (1000 * 60 * 60 * 24)
//   const isOver3Days = daysDifference >= 3 ? false : true
//   const isCancellable = isOver30Min && isOver3Days

//   return (
//     <SafeAreaView
//       style={{
//         padding: spacing.small,
//         gap: 15,
//         alignItems: 'center',
//         flexDirection: 'row',
//         justifyContent: 'center',
//       }}>
//       <Button
//         text="RESCHEDULE"
//         preset="solid"
//         onPress={() => {
//           navigation.navigate('Calendar', {
//             isRescheduled: true,
//             repair_order_id: id!,
//           })
//         }}
//         style={[styles.outer]}
//       />

//       <Button
//         text="CANCEL"
//         preset="cancel"
//         disabled={isCancellable}
//         onPress={cancelAppointment}
//         textStyle={{
//           color: isCancellable ? colors.palette.neutral600 : '#b61616',
//           fontSize: 14,
//         }}
//         style={[
//           styles.outer,
//           {
//             backgroundColor: isCancellable ? colors.gray500 : '#fff',
//             borderColor: isCancellable ? '#fff' : '#b61616',
//           },
//         ]}
//       />
//     </SafeAreaView>
//   )
// }

// const styles = StyleSheet.create({
//   outer: { width: '40%', paddingVertical: 9, borderRadius: 5 },
// })
