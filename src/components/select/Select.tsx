import React, { useMemo } from 'react'
import { useCallback, useRef, useState } from 'react'
import { ListRenderItemInfo, View, Text, TextInput } from 'react-native'

import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { StyleSheet } from 'react-native'
import { SelectOption, SelectProps } from './types'
import { SelectItem } from './SelectItem'

import { SelectButton } from './SelectButton'
import { BottomSheetModal } from '../BottomSheetModal'
import type { BottomSheetModalInstance } from '../BottomSheetModal'
import { setISOWeekYear } from 'date-fns'
import { useThrottledValue } from '../hooks/useThrottledValue'

function keyExtractor<T>(item: SelectOption<T>) {
  return `select-item-${item.value}`
}

export function Select<T>({
  options,
  onChange,
  disabled,
  invalid,
  placeholder = 'Select Item',
  value,
  styles,
}: SelectProps<T>) {
  const bottomSheetModalRef = useRef<BottomSheetModalInstance>(null)

  const [open, setOpen] = useState(false)
  const [undeferredSearch, setSearch] = useState('')
  const search = useThrottledValue(undeferredSearch, 500)
  const filterOptions = useMemo(() => {
    if (!search) return options
    const lowercasedSearch = search.toLowerCase()
    return (options ?? []).filter(
      option => option?.label.toLowerCase().includes(lowercasedSearch), // assuming objects have a 'name' property
    )
  }, [options, search])
  const handleSelectItemPress = useCallback(
    (value: T) => {
      bottomSheetModalRef.current?.dismiss()
      setOpen(false)
      if (onChange) {
        onChange(value)
      }
    },
    [onChange],
  )

  const handleSelectButtonPress = useCallback(() => {
    bottomSheetModalRef.current?.present()
    setOpen(state => !state)
  }, [])
  const handleSheetDismiss = useCallback(() => {
    setOpen(false)
    bottomSheetModalRef.current?.dismiss()
  }, [])

  const renderSelectItem = useCallback(
    ({ item, index }: ListRenderItemInfo<SelectOption<T>>) => {
      return index === 0 ? (
        <>
          <SelectItem
            key={`select-item-0${index}`}
            value={'Select'}
            label={placeholder}
            // @ts-ignore
            onPress={() => {}}
            disabled={true}
          />
          <SelectItem
            key={`select-item-${index}`}
            value={item.value}
            label={item.label}
            // @ts-ignore
            onPress={handleSelectItemPress}
          />
        </>
      ) : (
        <SelectItem
          key={`select-item-${index}`}
          value={item.value}
          label={item.label}
          // @ts-ignore
          onPress={handleSelectItemPress}
        />
      )
    },
    [handleSelectItemPress],
  )

  return (
    <>
      <SelectButton
        open={open}
        label={
          value !== undefined
            ? options?.filter(t => t.value === value)?.[0]?.label ?? placeholder
            : placeholder
        }
        disabled={disabled}
        onPress={handleSelectButtonPress}
        styles={[styles]}
        invalid={invalid}
      />

      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={['60%', '85%']}
        onDismiss={handleSheetDismiss}>
        <BottomSheetFlatList
          data={filterOptions}
          keyExtractor={keyExtractor}
          renderItem={renderSelectItem}
          ItemSeparatorComponent={() => (
            <View
              style={{
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderColor: '#1e1e1e',
              }}
            />
          )}
        />
      </BottomSheetModal>
    </>
  )
}

const styles = StyleSheet.create({})
