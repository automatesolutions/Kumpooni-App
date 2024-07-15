import { StyleSheet, View } from 'react-native'
import React, { useState } from 'react'
import { atoms as a } from '#/theme'

import dayjs from 'dayjs'

import Clipboard from '@react-native-community/clipboard'
import { Text } from '../Typography'
import { colors, spacing } from '#/utils/theme'
interface OrderDetailsProps {
  referenceNo: number
  created_at: string
}
export const OrderDetails = ({
  referenceNo = 0,
  created_at,
}: OrderDetailsProps) => {
  const copyToClipboard = () => {
    Clipboard.setString(`${referenceNo}`)
  }

  return (
    <View style={styles.root}>
      <View style={styles.flexBetween}>
        <Text style={[a.font_bold]}>Ref No.</Text>
        <Text style={[a.text_md]}>
          #{referenceNo}
          <Text onPress={copyToClipboard} style={{ color: colors.info }}>
            {` Copy`}
          </Text>
        </Text>
      </View>
      <View style={styles.flexBetween}>
        <Text>Placed On</Text>
        <Text>{dayjs(created_at).format('D MMM YYYY hh:mm:A')}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    padding: spacing.medium,
    gap: 5,
  },
  flexBetween: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  copiedText: {
    marginTop: 10,
    color: 'red',
  },
})
