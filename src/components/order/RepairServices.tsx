import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import React from 'react'
import { Text } from '../Typography'
import { currency } from '#/lib/strings/currency'
import { Service, ServicesArray } from '#/types/automate'

interface RepairServicesProps {
  services: Service[]
  priceRequired?: boolean
  style?: StyleProp<ViewStyle>
}
export const RepairServices = ({
  services,
  priceRequired = false,
  style,
}: RepairServicesProps) => {
  return (
    <View style={style}>
      {services?.map(service => {
        return (
          <View style={styles.itemContent} key={service.id}>
            <Text style={{ color: '#000', maxWidth: '70%', fontWeight: '500' }}>
              {service?.name
                ? service?.name
                : service?.service_name
                ? service?.service_name
                : ''}
            </Text>

            <View style={{ flexDirection: 'row' }}>
              <Text style={{ color: '#000', alignSelf: 'flex-start' }}>
                {priceRequired ? currency.format(service.price ?? 0) : ''}
              </Text>
              {service.quantity > 1 && <Text> x {service.quantity}</Text>}
            </View>
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
    textAlign: 'center',
  },
})
