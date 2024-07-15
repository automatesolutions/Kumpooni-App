import {
  ActivityIndicator,
  ListRenderItemInfo,
  SectionList,
  View,
  ViewStyle,
  StyleSheet,
  RefreshControl,
} from 'react-native'
import React, { useCallback } from 'react'

import { useSession } from '#/state/session'
import { useNotifications } from '#/state/queries/notification'
import { Text } from '#/components/Typography'
import { colors, spacing } from '#/utils/theme'
import { useDate } from '#/lib/hooks/useDate'
import { NotificationCard } from '#/components/notification/NotificationCard'
import { LoaderComponent } from '#/components/Loader'
import { ParsedNotification } from '#/types/automate'
import { EmptyNotification } from '#/components/notification/EmptyNotification'

export const NotificationScreen = () => {
  const { session } = useSession()
  const { data, refetch, isRefetching, isLoading } = useNotifications(
    session?.user?.id,
  )
  const date = useDate()

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ParsedNotification>) => {
      return <NotificationCard notification={item} />
    },
    [],
  )

  if (isLoading)
    return <LoaderComponent style={{ flex: 1, alignItems: 'center' }} />

  return (
    <View style={$root}>
      <Text
        style={{
          fontWeight: 'bold',
          marginTop: 10,
          fontSize: 14,
          paddingHorizontal: spacing.medium,
        }}>
        Last 7 - Days
      </Text>
      <SectionList<ParsedNotification>
        //@ts-ignore
        sections={data}
        style={{ flex: 1 }}
        contentContainerStyle={{
          gap: 6,
        }}
        stickyHeaderHiddenOnScroll
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <Text style={styles.heading}>
            {date.formatDate(section?.date, 'MMMM DD, YYYY')}
          </Text>
        )}
        ListEmptyComponent={() => (
          <EmptyNotification
            title="No Notification!"
            message="Your notification will appear here."
          />
        )}
        refreshControl={
          <RefreshControl
            onRefresh={refetch}
            refreshing={isRefetching}
            tintColor={colors.palette.neutral100}
          />
        }
      />
    </View>
  )
}
const styles = StyleSheet.create({
  heading: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e1e1e',
    paddingBottom: 4,
  },
})
const $root: ViewStyle = {
  flex: 1,
  backgroundColor: '#f6f6f6',
}
