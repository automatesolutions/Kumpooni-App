import { Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import PhoneField from './PhoneField'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { spacing } from '#/utils/theme'
import { phoneSchema } from '#/modules/account/account.model'
type PhoneFormValues = z.infer<typeof phoneSchema>

type LoginWithPhoneProp = {
  handleSubmitPhoneNumber: (phone: string) => void
}

const INPUT_NAME = 'phone'
const phCode = '63'
const LoginWithPhone = (props: LoginWithPhoneProp) => {
  const { handleSubmitPhoneNumber } = props
  const { control, handleSubmit, watch } = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
  })

  const inputValue = watch(INPUT_NAME)

  const onSubmit = (data: PhoneFormValues) => {
    const phoneNumber = `${phCode}${data.phone}`
    console.log('phoneNumber', phoneNumber)
    handleSubmitPhoneNumber(phoneNumber)
  }
  return (
    <>
      <Controller
        control={control}
        name={'phone'}
        render={({
          field: { value, onChange, onBlur },
          fieldState: { error, invalid },
        }) => (
          <>
            <PhoneField
              label={'Phone Number'}
              keyboardType="phone-pad"
              placeholder="912 345 6789"
              placeholderTextColor={'#625C58'}
              maxLength={10}
              onBlur={onBlur}
              value={value}
              onChangeText={onChange}
              invalid={invalid}
              error={error}
            />
          </>
        )}
      />

      <Pressable
        style={[styles.sendCode, { opacity: !inputValue ? 0.7 : 1 }]}
        onPress={handleSubmit(onSubmit)}
        disabled={!inputValue}>
        <Text style={[styles.sendBtn]}>Send Code</Text>
      </Pressable>
    </>
  )
}

export { LoginWithPhone }

const styles = StyleSheet.create({
  sendBtn: { color: '#fff', fontSize: 14 },
  sendCode: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    width: '100%',
    marginTop: spacing.extraSmall,
    borderRadius: 25,
    padding: spacing.small,
  },
})
