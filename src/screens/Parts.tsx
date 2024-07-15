import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text} from '#/components/Typography';

import {useTheme, atoms as a} from '#/theme';

export function PartsScreen() {
  const t = useTheme();

  return (
    <View style={[a.flex_1, t.atoms.bg]}>
      <Text>PartsScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({});
