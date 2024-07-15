import React, { useRef, useState } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Pressable,
} from 'react-native'
import { Text } from '#/components/Typography'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useTheme, atoms as a } from '#/theme'
import { CommonNavigatorParams, NavigationProp } from '#/lib/routes/types'
import { Star } from 'lucide-react-native'
import { color } from '#/theme/tokens'
import { Button } from '#/components/Button'
import { s } from '#/lib/styles'
import { colors } from '#/utils/theme'
import { RepairServices } from '#/components/order/RepairServices'
import { ServicesDetails } from '#/components/order/OrderItem'
import { supabase } from '#/lib/supabase'
import { useSession } from '#/state/session'
import { logger } from '#/logger'
import { cleanError, isNetworkError } from '#/lib/strings/errors'
import { useNavigation } from '@react-navigation/native'
import * as Toast from '#/components/utils/Toast'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'WriteReview'>
export function WriteReviewScreen({ route }: Props) {
  const { params } = route
  const t = useTheme()
  const [isProcessing, setProcessing] = useState<boolean>(false)
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const { session } = useSession()
  const textRef = useRef<TextInput>(null)
  const navigation = useNavigation<NavigationProp>()
  const onPressRating = (num: number) => {
    setRating(prevRating => (prevRating === num ? 0 : num))
  }
  console.log('params', params)

  const onPressSubmit = async () => {
    setProcessing(true)

    try {
      const { data, error: insertError } = await supabase
        .from('reviews')
        .insert([
          {
            content: content,
            rating: rating,
            store_id: params.storeId,
            repair_order_id: params.repairOrderId,
            user_id: session?.user.id,
          },
        ])
        .select('id')
        .single()

      if (data) {
        setProcessing(false)
        Toast.show('Your review submitted successfully.')
        navigation.navigate('HomeTab')
        return
      }

      if (insertError) {
        logger.error('onPressSubmit', { insertError })
        throw insertError
      }
    } catch (e) {
      if (isNetworkError(e)) {
        setError(
          `Failed to save your review. Check your internet connection and try again.`,
        )
      } else {
        setError(cleanError(e))
      }
    }

    setProcessing(false)
  }
  return (
    <View style={[a.flex_1, t.atoms.bg]}>
      <View style={[a.p_2xs]}>
        <Text style={[a.text_lg, a.font_bold]}>Core Automotive</Text>
      </View>

      <ServicesDetails services={params.services} style={[a.px_2xs]} />

      <View
        style={[
          a.px_2xs,
          a.py_xs,
          a.flex_row,
          a.justify_between,
          a.align_center,
          a.border_b,
          { borderColor: color.gray_200 },
        ]}>
        <Text style={[a.font_bold]}>Overall Rating</Text>
        <View style={[a.flex_row, { gap: 4 }]}>
          {[1, 2, 3, 4, 5].map(num => {
            const isGreater = rating >= num
            return (
              <TouchableOpacity
                key={`${num}`}
                onPress={() => onPressRating(num)}>
                <Star
                  color={isGreater ? '#FF8700' : '#000'}
                  size={16}
                  fill={isGreater ? '#FF8700' : '#000'}
                />
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      <View style={[a.p_sm]}>
        <Text style={[a.font_bold, a.text_md, a.mb_2xs]}>Feedback:</Text>

        <TextInput
          ref={textRef}
          multiline
          onChangeText={v => setContent(v)}
          style={[
            a.rounded_xs,
            a.text_md,
            a.px_2xs,
            a.border,
            { borderColor: '#d9d9d9', height: 250, textAlignVertical: 'top' },
          ]}
        />
      </View>
      {isProcessing ? (
        <View style={[styles.btn, { backgroundColor: color.gray_100 }]}>
          <ActivityIndicator color={'#000'} />
        </View>
      ) : (
        <Button
          onPress={onPressSubmit}
          label="Submit"
          variant="solid"
          color="primary"
          size={'small'}
          style={[styles.btn]}>
          Submit
        </Button>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    alignSelf: 'center',
    borderRadius: 32,
    padding: 10,
    marginTop: 20,
  },
})
