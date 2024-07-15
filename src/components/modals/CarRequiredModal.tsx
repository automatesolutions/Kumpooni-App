import React, { useState } from 'react'

import { useNavigation } from '@react-navigation/native'
import Modal from 'react-native-modal'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { NavigationProp } from '#/lib/routes/types'
import { colors } from '#/utils/theme'

export function CarRequiredModal({
  isOpen,
  closeModal,
}: {
  isOpen: boolean
  closeModal: () => void
}) {
  const navigation = useNavigation<NavigationProp>()

  const navigateToCarSelection = () => {
    closeModal()
    setTimeout(
      () =>
        navigation.navigate('Vehicle', {
          isFirstVehicle: true,
        }),
      500,
    )
  }

  return (
    <Modal
      isVisible={isOpen}
      backdropOpacity={0.3}
      style={{
        marginHorizontal: 32,
      }}
      animationOut={'fadeOutDown'}
      animationOutTiming={400}>
      <View style={styles.container}>
        <View
          style={{
            alignItems: 'center',
            paddingHorizontal: 20,
            flex: 1,
            justifyContent: 'center',
          }}>
          <Text style={styles.heading}>Add your vehicle information</Text>
          <Text style={styles.paragraph}>
            To provide you with the best assistance, we'll need some details
            about your vehicle.
          </Text>
        </View>

        <View style={styles.actionBtn}>
          <TouchableOpacity
            style={[
              styles.btn,
              {
                borderRightWidth: 1,
                borderColor: colors.gray500,
                borderBottomLeftRadius: 10,
                backgroundColor: '#fff',
              },
            ]}
            onPress={closeModal}>
            <Text
              style={[
                styles.btnLabel,
                { fontWeight: '400', color: colors.orange },
              ]}>
              Close
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn]}
            onPress={navigateToCarSelection}>
            <Text
              style={[
                styles.btnLabel,
                { fontWeight: '700', color: colors.black },
              ]}>
              Add
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}
const styles = StyleSheet.create({
  container: {
    height: 150,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
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
    height: '100%',
    justifyContent: 'center',
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
