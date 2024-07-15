// import { toast } from '../../components/toast';
import * as Toast from '#/components/utils/Toast'
import { useNavigation } from '@react-navigation/native'

import { supabase } from '../../lib/supabase'

import { NavigationProp } from '../routes/types'
import { useGlobalLoadingControls } from '#/state/shell/global-loading'
import { isProfileIncomplete } from '#/state/queries/auth'

export const useLogin = () => {
  const globalLoading = useGlobalLoadingControls()
  const navigation = useNavigation<NavigationProp>()

  const handlePhoneVerifyOtp = async (phone: string, token: string) => {
    try {
      globalLoading.show()
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
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

      throw error
    } catch (error: any) {
      Toast.show(`${error?.message}`)
    } finally {
      globalLoading.hide()
    }
  }

  const handleResendOtp = async (phone: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phone,
      })

      if (error) throw error
    } catch (error) {
      navigation.navigate('Login')
    }
  }
  return { handlePhoneVerifyOtp, handleResendOtp }
}
