import { VehicleWithBrand } from '#/types/automate'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { Text } from '../Typography'

export function CarDetails({
  vehicle,
  style,
}: {
  vehicle: VehicleWithBrand
  style?: StyleProp<ViewStyle>
}) {
  if (!vehicle) {
    return null
  }
  const { brand, model, year_model, plate_no } = vehicle
  return (
    <View style={[styles.outer, style]}>
      {/* <Text
        style={{
          fontSize: 14,
          fontWeight: '700',
          color: '#000',
          paddingRight: 5,
        }}>
        Car Info:
      </Text> */}
      <View style={styles.box}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#000' }}>
          {`${brand.name} ${model.name} ${year_model} ${plate_no} `}
        </Text>
        {/* <Text style={styles.label}>Car Model</Text> */}
      </View>
      {/* <View style={styles.box}>
        <Text style={styles.text}>{` ${year_model} `}</Text>
        <Text style={styles.label}>Year Model</Text>
      </View>
      {plate_no !== '' && (
        <View style={styles.box}>
          <Text style={styles.text}>{`    ${plate_no} `}</Text>
          <Text style={styles.label}> Plate No.</Text>
        </View>
      )} */}
    </View>
  )
}

export const styles = StyleSheet.create({
  outer: {
    paddingTop: 4,
    flexDirection: 'row',
  },
  text: { fontSize: 14, fontWeight: '700', color: '#000' },
  label: { fontSize: 10, color: '#68696d', fontWeight: '500' },
  box: { justifyContent: 'center', alignItems: 'center' },
})
