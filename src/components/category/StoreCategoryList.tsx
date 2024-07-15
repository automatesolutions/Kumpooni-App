import React, { useCallback, useState } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  ListRenderItemInfo,
  TouchableOpacity,
} from 'react-native'
import { Text } from '#/components/Typography'
import { useTheme, atoms as a } from '#/theme'
type StoreCategoryListProps = {
  categories: { id: number; name: string }[]
  onSelected: (id: number) => void
  selectedCategory: number
}
type Category = { id: number; name: string }
export function StoreCategoryList({
  categories,
  onSelected,
  selectedCategory,
}: StoreCategoryListProps) {
  const t = useTheme()

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Category>) => {
      const selected = item.id === selectedCategory
      return (
        <TouchableOpacity
          style={[
            { paddingHorizontal: 4, borderRadius: 5 },
            selected && { backgroundColor: '#F3F0F0' },
          ]}
          onPress={() => onSelected(item.id)}>
          <Text style={[selected && a.font_bold]}>{item.name}</Text>
        </TouchableOpacity>
      )
    },
    [selectedCategory],
  )
  return (
    <View>
      <FlatList
        horizontal
        data={categories}
        renderItem={renderItem}
        keyExtractor={item => `${item.id}`}
        contentContainerStyle={{
          gap: 10,
        }}
        style={[a.mx_2xs, a.pb_2xs, { paddingTop: 3 }]}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({})
