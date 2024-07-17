import {VehicleWithBrand} from '#/types/automate';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import {Text} from '../Typography';

export function CarDetails({
  vehicle,
  style,
}: {
  vehicle: VehicleWithBrand;
  style?: StyleProp<ViewStyle>;
}) {
  if (!vehicle) {
    return null;
  }
  const {brand, model, year_model, plate_no} = vehicle;
  return (
    <View style={[styles.outer, style]}>
      <View style={styles.box}>
        <Text style={{fontSize: 14, fontWeight: '600', color: '#000'}}>
          {`${brand.name} ${model.name} ${year_model} ${plate_no} `}
        </Text>
      </View>
    </View>
  );
}

export const styles = StyleSheet.create({
  outer: {
    paddingTop: 4,
    flexDirection: 'row',
  },
  text: {fontSize: 14, fontWeight: '700', color: '#000'},
  label: {fontSize: 10, color: '#68696d', fontWeight: '500'},
  box: {justifyContent: 'center', alignItems: 'center'},
});
