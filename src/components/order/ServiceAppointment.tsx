import { CalendarDays } from 'lucide-react-native'
import React from 'react'
import { View, StyleSheet } from 'react-native'

import { convertTo12HourFormat, formatDate } from '../../lib/utils'

import { RepairStatus, VehicleWithBrand } from '../../types/automate'
import { colors, spacing } from '#/utils/theme'
import { Text } from '../Typography'
import { atoms as a } from '#/theme'

export function ServiceAppointment({
  appointment_date,
  appointment_time,
  vehicle,
  status,
}: {
  appointment_time: string | null
  appointment_date: string | null
  vehicle: VehicleWithBrand
  status: RepairStatus
}) {
  return (
    <View
      style={{ padding: spacing.medium, gap: 10, backgroundColor: '#41C575' }}>
      <View style={styles.vehicle}>
        <CalendarDays size={45} color="#fff" />
        <View>
          <Text style={{ color: '#fff' }}>Service Appointment</Text>
          {appointment_date && appointment_time ? (
            <Text style={{ lineHeight: 20, color: '#fff', fontWeight: 'bold' }}>
              {`${formatDate(appointment_date)} ${convertTo12HourFormat(
                appointment_time,
              )}`}
            </Text>
          ) : null}
        </View>
      </View>
      {vehicle && <CarDetails vehicle={vehicle} />}
    </View>
  )
}

function CarDetails({ vehicle }: { vehicle: VehicleWithBrand }) {
  const { year_model, brand, model, plate_no } = vehicle
  return (
    <View>
      <Text style={[{ color: colors.white }, a.font_bold, a.text_md]}>
        {`${year_model} ${brand?.name} ${model?.name}`}
      </Text>

      <Text style={{ color: colors.white }}>
        Plate no: {plate_no ? plate_no : 'N/A'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  vehicle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flexBetween: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})
