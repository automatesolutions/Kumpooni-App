import { GestureResponderEvent, Pressable } from 'react-native'
import { Button, ButtonProps } from './Button'
import { StackActions, useLinkProps } from '@react-navigation/native'
import { AllNavigatorParams } from '#/lib/routes/types'
import { useNavigationDeduped } from '#/lib/hooks/useNavigationDeDuped'
import { sanitizeUrl } from '@braintree/sanitize-url'

import {
  convertAutomateAppUrlIfNeeded,
  isExternalUrl,
  linkRequiresWarning,
} from '#/lib/strings/url-helpers'
import React from 'react'
import { isWeb } from '#/platform/detection'
import { router } from '#/routes'
import { atoms as a, flatten, web } from '#/theme'

type BaseLinkProps = Pick<
  Parameters<typeof useLinkProps<AllNavigatorParams>>[0],
  'to'
> & {
  testID?: string
  label?: string
  action?: 'push' | 'replace' | 'navigate'
  disableMismatchWarning?: boolean
  onPress?: (e: GestureResponderEvent) => void | false
  download?: string
}

export function useLink({
  to,
  displayText,
  action = 'push',
  disableMismatchWarning,
  onPress: outerOnPress,
}: BaseLinkProps & {
  displayText: string
}) {
  const navigation = useNavigationDeduped()
  const { href } = useLinkProps<AllNavigatorParams>({
    to:
      typeof to === 'string'
        ? convertAutomateAppUrlIfNeeded(sanitizeUrl(to))
        : to,
  })
  const isExternal = isExternalUrl(href)
  const onPress = React.useCallback(
    (e: GestureResponderEvent) => {
      const exitEarlyIfFalse = outerOnPress?.(e)

      if (exitEarlyIfFalse === false) return

      const requiresWarning = Boolean(
        !disableMismatchWarning &&
          displayText &&
          isExternal &&
          linkRequiresWarning(href, displayText),
      )

      if (requiresWarning) {
        e.preventDefault()
        // todo: Show warning before linking
        return
      } else {
        e.preventDefault()
        if (isExternal) {
          // todo: navigate the user to the external link or use in-app browser
          return
        } else {
          /**
           * A `GestureResponderEvent`, but cast to `any` to avoid using a bunch
           * of @ts-ignore below.
           */
          const event = e as any
          const isMiddleClick = isWeb && event.button === 1
          const isMetaKey =
            isWeb &&
            (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)

          const shouldOpenInNewTab = isMetaKey || isMiddleClick

          if (
            shouldOpenInNewTab ||
            href.startsWith('http') ||
            href.startsWith('mailto')
          ) {
            // todo:open in new tab
            return
          } else {
            if (action === 'push') {
              navigation.dispatch(StackActions.push(...router.matchPath(href)))
            } else if (action === 'replace') {
              navigation.dispatch(
                StackActions.replace(...router.matchPath(href)),
              )
            } else if (action === 'navigate') {
              // @ts-ignore
              navigation.navigate(...router.matchPath(href))
            } else {
              throw Error('Unsupported navigator action.')
            }
          }
        }
      }
    },
    [
      outerOnPress,
      disableMismatchWarning,
      displayText,
      isExternal,
      href,
      action,
      navigation,
    ],
  )

  return {
    isExternal,
    href,
    onPress,
  }
}

export type LinkProps = Omit<BaseLinkProps, 'disableMismatchWarning'> &
  Omit<ButtonProps, 'onPress' | 'disabled' | 'label'>

/**
 * A interactive element that renders as a `<a>` tag on the web. On mobile it
 * will translate the `href` to navigator screens and params and dispatch a
 * navigation action.
 *
 * Intended to behave as a web anchor tag. For more complex routing, use a
 * `Button`.
 */
export function Link({
  children,
  to,
  action,
  onPress: outerOnPress,
  download,
  ...rest
}: LinkProps) {
  const { href, isExternal, onPress } = useLink({
    to,
    displayText: typeof children === 'string' ? children : '',
    action,
    onPress: outerOnPress,
    download,
  })

  return (
    <Button
      label={href}
      {...rest}
      style={[a.justify_start, flatten(rest.style)]}
      role="link"
      accessibilityRole="link"
      onPress={download ? undefined : onPress}
      {...web({
        hrefAttrs: {
          target: download ? undefined : isExternal ? 'blank' : undefined,
          rel: isExternal ? 'noopener noreferrer' : undefined,
          download,
        },
        dataSet: {
          // default to no underline, apply this ourselves
          noUnderline: '1',
        },
      })}>
      {children}
    </Button>
  )
}
