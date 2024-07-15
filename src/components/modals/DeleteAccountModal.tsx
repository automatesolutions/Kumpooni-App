import { colors } from '#/utils/theme'
import React from 'react'

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'

import Modal from 'react-native-modal'

type DeleteAccountModalProps = {
  isOpen: boolean
  onClosed: () => void
  onPressDeleteAccount: () => void
}
export function DeleteAccountModal({
  isOpen,
  onClosed,
  onPressDeleteAccount,
}: DeleteAccountModalProps) {
  return (
    <Modal
      isVisible={isOpen}
      backdropOpacity={0.3}
      style={{
        marginHorizontal: 32,
        flex: 1,
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
          <Text style={styles.heading}>Delete Account</Text>
          <Text style={styles.paragraph}>
            Are you sure you want to permanently delete your account?
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
            onPress={onClosed}>
            <Text
              style={[
                styles.btnLabel,
                { fontWeight: '400', color: colors.orange },
              ]}>
              Close
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn]} onPress={onPressDeleteAccount}>
            <Text
              style={[
                styles.btnLabel,
                { fontWeight: '400', color: colors.black },
              ]}>
              Yes, Delete
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

    alignItems: 'center',
    borderRadius: 10,
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
