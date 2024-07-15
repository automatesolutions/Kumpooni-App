import React, { SetStateAction, useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { Text } from '#/components/Typography'
import { useTheme, atoms as a, useBreakpoints } from '#/theme'
import * as Toggle from '#/components/forms/Toggle'
import { Button, ButtonIcon, ButtonText } from '../Button'

import { PlusLarge_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus'
import { Loader } from '../ButtonLoader'
type PaymentMethodSelectionProps = {
  option: string
  onSelect: (options: string) => void
}
export function PaymentMethodSelection({
  option,
  onSelect,
}: PaymentMethodSelectionProps) {
  const t = useTheme()
  const [options, setOptions] = useState([option])
  const { gtMobile } = useBreakpoints()
  React.useEffect(() => {
    onSelect(options[0])
  }, [options, onSelect])
  return (
    <View style={[t.atoms.bg, a.p_xs]}>
      <Text style={[a.text_md, a.font_bold]}>Payment method</Text>
      <View style={[]}>
        <Toggle.Group
          label={`Toggle between muted word options.`}
          type="radio"
          values={options}
          onChange={setOptions}>
          <View
            style={[
              a.pt_sm,
              a.py_sm,
              a.flex_row,
              a.align_center,
              a.gap_sm,
              a.flex_wrap,
            ]}>
            <Toggle.Item
              label={`Cash`}
              name="Cash"
              style={[a.flex_1, !gtMobile && [a.w_full, a.flex_0]]}>
              <View
                style={[
                  a.flex_1,
                  a.flex_row,
                  a.align_center,
                  a.justify_between,
                  a.gap_xs,
                ]}>
                <View style={[a.flex_row, a.align_center, a.gap_3xs]}>
                  <Image
                    source={{
                      uri: 'https://vheyzzpdmmyiejsxerzg.supabase.co/storage/v1/object/public/image/cash-coin.png',
                    }}
                    style={{
                      height: 25,
                      aspectRatio: 1 / 1,
                    }}
                    resizeMode="contain"
                  />
                  <Text>Cash</Text>
                </View>

                <Toggle.Radio size={22} />
              </View>
            </Toggle.Item>

            <Toggle.Item
              label={`Gcash`}
              name="Gcash"
              style={[a.flex_1, !gtMobile && [a.w_full, a.flex_0]]}>
              <View
                style={[
                  a.flex_1,
                  a.flex_row,
                  a.align_center,
                  a.justify_between,
                  a.gap_sm,
                ]}>
                <View style={[a.flex_row, a.align_center, a.gap_3xs]}>
                  <Image
                    source={{
                      uri: 'https://vheyzzpdmmyiejsxerzg.supabase.co/storage/v1/object/public/image/gcash.png',
                    }}
                    style={{
                      height: 25,
                      aspectRatio: 1 / 1,
                    }}
                    resizeMode="contain"
                  />
                  <Text>Gcash</Text>
                </View>
                <Toggle.Radio size={22} />
              </View>
            </Toggle.Item>
          </View>
        </Toggle.Group>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({})

function TargetToggle({ children }: React.PropsWithChildren<{}>) {
  const t = useTheme()
  const ctx = Toggle.useItemContext()
  const { gtMobile } = useBreakpoints()
  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.justify_between,
        a.gap_xs,
        a.flex_1,
        a.py_sm,
        a.px_sm,
        gtMobile && a.px_md,
        a.rounded_sm,
        t.atoms.bg_contrast_50,
        (ctx.hovered || ctx.focused) && t.atoms.bg_contrast_100,
        ctx.selected && [
          {
            backgroundColor:
              t.name === 'light' ? t.palette.primary_50 : t.palette.primary_975,
          },
        ],
        ctx.disabled && {
          opacity: 0.8,
        },
      ]}>
      {children}
    </View>
  )
}
