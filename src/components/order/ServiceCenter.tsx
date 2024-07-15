import { Linking, Pressable, StyleSheet, View } from 'react-native'
import React from 'react'

import { ArrowUpRight, MapPin, Phone, Store } from 'lucide-react-native'

import { Store as StoreItem } from '#/types/automate'
import { spacing } from '#/utils/theme'
import { Text } from '../Typography'
import { atoms as a } from '#/theme'
export function ServiceCenter({ store }: { store: StoreItem }) {
  return (
    <View style={styles.storeSection}>
      <Text style={[a.font_bold]}>Service Center</Text>
      <View style={[styles.storeInfo]}>
        <Store color="#000" size={20} />
        <Text style={[{ flex: 1, fontWeight: 'bold' }, a.text_xs]}>
          {store.name}
        </Text>
      </View>
      <View style={styles.storeInfo}>
        <MapPin color="#000" size={20} />
        <Text style={[{ maxWidth: 280, flex: 1 }, a.text_xs]}>
          {store.address}
        </Text>
        {/* <Pressable
          onPress={() =>
            Linking.openURL('https://maps.app.goo.gl/cFpbHjKDwzXnpgY37')
          }>
          <ArrowUpRight color="#000" size={20} />
        </Pressable> */}
      </View>
      <View style={styles.storeInfo}>
        <Phone color="#000" size={20} />
        <Text style={[{ flex: 1 }, a.text_xs]}>{store.contact_no}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  storeSection: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,

    borderBottomWidth: 8,
    borderColor: '#f5f5f5',
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 10,
  },
})
