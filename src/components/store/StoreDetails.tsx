import React from 'react';
import {View, StyleSheet, Text, StyleProp, ViewStyle} from 'react-native';
import {colors, s} from '#/lib/styles';
import {Store as StoreType} from '#/types/automate';

import {Store} from 'lucide-react-native';
export function StoreDetails({
  store,
  style,
}: {
  store: {id: string; name: string};
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[s.flexRow, s.alignCenter, {gap: 10}, style]}>
      <Store size={16} color="#1e1e1e" />
      <View>
        <Text style={styles.name}>{store.name}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '400',
    color: '#1e1e1e',
    lineHeight: 13,
  },
});
