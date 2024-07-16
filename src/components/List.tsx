import React from 'react';
import {View, StyleSheet, StyleProp, ViewStyle} from 'react-native';
import {Text} from '#/components/Typography';
import {useTheme, atoms as a, flatten} from '#/theme';
import {cleanError} from '#/lib/strings/errors';
import {Button, ButtonText} from '#/components/Button';
import {Loader} from '#/components/Loader';

export function ListFooter({
  isFetchingNextPage,
  hasNextPage,
  error,
  onRetry,
  height,
  style,
  showEndMessage,
  endMessageText,
}: {
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  error?: string;
  onRetry?: () => Promise<unknown>;
  height?: number;
  style?: StyleProp<ViewStyle>;
  showEndMessage?: boolean;
  endMessageText?: string;
}) {
  const t = useTheme();

  return (
    <View
      style={[
        a.w_full,
        a.align_center,
        a.border_t,
        a.pb_lg,
        t.atoms.border_contrast_low,
        {height: height ?? 180, paddingTop: 30},
        flatten(style),
      ]}>
      {isFetchingNextPage ? (
        <Loader size="xl" />
      ) : error ? (
        <ListFooterMaybeError error={error} onRetry={onRetry} />
      ) : !hasNextPage && showEndMessage ? (
        <Text style={[a.text_sm, t.atoms.text_contrast_low]}>
          {endMessageText ?? 'You have reached the end'}
        </Text>
      ) : null}
    </View>
  );
}

function ListFooterMaybeError({
  error,
  onRetry,
}: {
  error?: string;
  onRetry?: () => Promise<unknown>;
}) {
  const t = useTheme();

  if (!error) return null;

  return (
    <View style={[a.w_full, a.px_lg]}>
      <View
        style={[
          a.flex_row,
          a.gap_md,
          a.p_md,
          a.rounded_sm,
          a.align_center,
          t.atoms.bg_contrast_25,
        ]}>
        <Text
          style={[a.flex_1, a.text_sm, t.atoms.text_contrast_medium]}
          numberOfLines={2}>
          {error ? cleanError(error) : `Oops, something went wrong`}
        </Text>
        <Button
          variant="gradient"
          label={`Press to retry`}
          style={[
            a.align_center,
            a.justify_center,
            a.rounded_sm,
            a.overflow_hidden,
            a.px_md,
            a.py_sm,
          ]}
          onPress={onRetry}>
          <ButtonText>Retry</ButtonText>
        </Button>
      </View>
    </View>
  );
}
