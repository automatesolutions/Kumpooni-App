import { Service, Services } from '#/types/automate'
import { colors } from '#/utils/theme'
import { atoms as a } from '#/theme'
import React from 'react'

import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'

import Modal from 'react-native-modal'
import { Text } from '../Typography'
import { currency } from '#/lib/strings/currency'

type ServiceDetailModal = {
  isOpen: boolean
  onClosed: () => void
  services: Service[]
  total: number
}
export function ServiceDetailModal({
  isOpen,
  onClosed,
  services,
  total,
}: ServiceDetailModal) {
  return (
    <Modal
      isVisible={isOpen}
      backdropOpacity={0.7}
      style={{
        marginHorizontal: 32,
        flex: 1,
      }}
      onBackdropPress={onClosed}
      animationOut={'fadeOutDown'}
      animationOutTiming={400}>
      <View style={styles.container}>
        <View style={[a.p_2xs]}>
          <Text style={[a.text_md, a.font_bold]}>Services</Text>
          {services ? (
            services.map(service => (
              <View
                key={service.id}
                style={[
                  a.flex_row,
                  a.align_center,
                  a.py_2xs,
                  {
                    justifyContent: 'space-between',
                    width: '100%',
                  },
                ]}>
                <Text style={[a.font_semibold]}>{service.name}</Text>
                {service.type === 'Product' ? (
                  <Text style={[a.text_xs]}>
                    {currency.format(service.price ?? 0) +
                      ` x ${service.quantity}`}
                  </Text>
                ) : (
                  <Text style={[a.text_xs]}>
                    {currency.format(service.price ?? 0)}
                  </Text>
                )}
                <View
                  style={[
                    {
                      height: 1,
                      backgroundColor: '#000',
                      width: '100%',
                      position: 'absolute',
                      bottom: 0,
                      alignSelf: 'center',
                    },
                  ]}
                />
              </View>
            ))
          ) : (
            <ActivityIndicator />
          )}
        </View>
        <View style={[a.p_2xs]}>
          <Text style={[a.font_semibold]}>Bill Details</Text>
          <View style={[a.flex_row, a.justify_between]}>
            <Text>Subtotal</Text>
            <Text>{currency.format(total)}</Text>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',

    borderRadius: 10,
    paddingVertical: 5,
    width: '100%',
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.palette.neutral700,
    paddingBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.palette.neutral700,
    textAlign: 'center',
    maxWidth: '100%',
  },
  actionBtn: {
    flexDirection: 'row',

    width: '100%',
    borderTopColor: colors.gray500,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 35,
    alignItems: 'center',
  },
  btn: {
    zIndex: 1,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },

  btnLabel: {
    color: colors.palette.neutral700,
    fontSize: 16,
  },
  absoluteView: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
