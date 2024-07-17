import React, {SetStateAction, useCallback, useState} from 'react';
import {
  View,
  StyleSheet,
  SectionList,
  FlatList,
  ListRenderItemInfo,
  TouchableOpacity,
} from 'react-native';
import {Text} from '#/components/Typography';
import {useTheme, atoms as a} from '#/theme';
import {color} from '#/theme/tokens';
import dayjs from 'dayjs';
type AvailableSlots = {
  available_date: string;
  available_timeslots: string[];
  week_day: string;
};
export function DateSelection({
  dateSlots,
  onPress,
}: {
  dateSlots: AvailableSlots[];
  onPress: (newDate: string) => void;
}) {
  const t = useTheme();
  const [active, setActive] = useState<number | null>(0);

  const onDayPress = (date: string, index: number) => {
    setActive(index);
    onPress(date);
  };

  const renderItem = useCallback(
    ({item, index}: ListRenderItemInfo<AvailableSlots>) => {
      const isActive = active === index;
      const activeColor = isActive ? color.blue_500 : '#000';
      return (
        <TouchableOpacity
          onPress={() => onDayPress(item.available_date, index)}
          style={[
            {
              height: 70,
              width: 70,
              backgroundColor: isActive ? color.blue_25 : '#fff',
            },
            a.align_center,
            a.justify_center,
            a.border,
            a.rounded_sm,
            t.atoms.border_contrast_high,
            {borderColor: isActive ? color.blue_500 : color.gray_200},
          ]}>
          <Text style={[a.text_xs, {color: activeColor}]}>{item.week_day}</Text>
          <Text style={[a.text_lg, a.font_bold, {color: activeColor}]}>
            {item.available_date.split('-')[2]}
          </Text>
        </TouchableOpacity>
      );
    },
    [active],
  );
  return (
    <View style={[a.px_xs]}>
      <View style={[a.flex_row, a.justify_between, a.py_sm]}>
        <Text style={[a.font_bold, a.text_md]}>Select date</Text>
        <Text style={[a.font_bold, a.text_md]}>
          {dayjs(dateSlots[0].available_date).format('MMMM')}
        </Text>
      </View>
      <FlatList
        horizontal
        data={dateSlots}
        renderItem={renderItem}
        contentContainerStyle={{
          gap: 10,
        }}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
  },
  header: {
    fontSize: 32,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
  },
});
