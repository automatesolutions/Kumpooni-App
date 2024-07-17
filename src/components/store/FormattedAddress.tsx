import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text} from '#/components/Typography';
import {useTheme, atoms as a} from '#/theme';

type StoreAddressProps = {
  address: string;
  distance: number;
};

export function FormattedAddress({distance, address}: StoreAddressProps) {
  const t = useTheme();
  const roundedKm = Math.round(distance * 10) / 10;

  return (
    <View style={{paddingTop: 2}}>
      <Text style={{fontSize: 10, color: '#625C58', maxWidth: '90%'}}>
        <Text style={{fontSize: 10, color: '#000', fontWeight: 'bold'}}>
          {`${roundedKm} km `}
        </Text>
        - {address}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({});
