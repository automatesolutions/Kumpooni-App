import React, { FC, useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { NativeStackScreenProps } from '@react-navigation/native-stack'

import OTPInputView from '@twotalltotems/react-native-otp-input'
import { useForm } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'
import { CommonNavigatorParams, NavigationProp } from '#/lib/routes/types'
import { otpSchema } from '#/modules/account/account.model'
import { useSessionApi } from '#/state/session'
import { colors } from '#/utils/theme'
import { useNavigation } from '@react-navigation/native'
import { supabase } from '#/lib/supabase'
import { isProfileIncomplete } from '#/state/queries/auth'
import * as Toast from '#/components/utils/Toast'
import { useGlobalLoadingControls } from '#/state/shell/global-loading'
type Props = NativeStackScreenProps<CommonNavigatorParams, 'Otp'>

export function OtpScreen({ route }: Props) {
  const { phone } = route.params
  const navigation = useNavigation<NavigationProp>()
  const globalLoading = useGlobalLoadingControls()
  const { loginWithPhone } = useSessionApi()

  const [countDown, setCountDown] = useState(60)
  // const [otp, setOtp] = useState<string>('')
  const form = useForm({
    resolver: zodResolver(otpSchema),
  })

  const onResendPressHandler = () => {
    loginWithPhone(phone)
    form.reset()
    setCountDown(60)
  }

  const handleVerifyOtp = async (code: string) => {
    try {
      globalLoading.show()
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: 'sms',
      })
      if (data?.session && data?.user) {
        const userExist = await isProfileIncomplete(data.user.id)
        if (userExist) {
          //@ts-ignore
          navigation.navigate('HomeTab')
        } else {
          navigation.navigate('CreateAccount')
        }
        return
      }
      globalLoading.hide()
      throw error
    } catch (error: any) {
      Toast.show(`${error?.message}`)
    }
  }

  useEffect(() => {
    if (countDown <= 0) return
    const time = setInterval(() => setCountDown(countDown - 1), 1000)

    return () => clearInterval(time)
  }, [countDown])

  return (
    <View style={styles.container}>
      <Text style={styles.message}>
        We have sent you an SMS verification code to your number
      </Text>
      <Text style={styles.title}>Verification Code</Text>
      <OTPInputView
        pinCount={6}
        style={{ height: 100 }}
        // code={otp}
        // onCodeChanged={code => setOtp(code)}
        autoFocusOnLoad={true}
        codeInputFieldStyle={styles.underlineStyleBase}
        codeInputHighlightStyle={styles.underlineStyleHighLighted}
        onCodeFilled={code => {
          handleVerifyOtp(code)
        }}
      />
      <View
        style={{
          flexDirection: 'row',
          gap: 20,
        }}>
        {countDown > 0 ? (
          <Text
            style={{
              color: '#000',
              fontSize: 14,
            }}>
            Resend Code in {countDown} seconds
          </Text>
        ) : (
          <TouchableOpacity
            disabled={countDown > 0}
            onPress={onResendPressHandler}
            style={[styles.button]}>
            <Text style={styles.btnText}>Resend code</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    backgroundColor: '#fff',
  },
  message: {
    maxWidth: 300,
    fontSize: 16,
    color: '#625C58',
    paddingVertical: 40,
  },
  title: {
    fontSize: 15,
    color: '#1e1e1e',
    fontWeight: 'bold',
  },
  otpInput: {
    borderBottomColor: 'black',
    borderBottomWidth: 1,
    padding: 2,
    marginTop: 10,
  },
  button: {
    backgroundColor: '#47BCFE',
    padding: 10,
    marginVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000',
  },
  underlineStyleBase: {
    width: 40,
    height: 45,
    borderWidth: 0,
    fontSize: 16,
    fontWeight: 'bold',
    borderBottomWidth: 2,
    color: '#000',
  },

  underlineStyleHighLighted: {
    borderColor: colors.primary,
  },
})
