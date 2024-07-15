import { StyleSheet, View } from 'react-native'
import React from 'react'
import { Parts } from '#/types/automate'
import { Text } from '../Text'
import { currency } from '#/lib/strings/currency'

interface RepairPartsProps {
  parts: Parts[]
}
export const RepairParts = ({ parts }: RepairPartsProps) => {
  return (
    <View>
      {parts?.map(part => {
        return (
          <View style={styles.itemContent} key={part.id}>
            <Text style={{ color: '#000' }}>{part.name}</Text>
            <Text style={{ color: '#000' }} size="xs">
              {currency.format(part.price ?? 0)}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 5,
  },
})
