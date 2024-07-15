import React from 'react'
import { Provider as ColorModeProvider } from './color-mode'
import { Provider as GlobalLoadingProvider } from './global-loading'

export { useThemePrefs, useSetThemePrefs } from './color-mode'
export function Provider({ children }: React.PropsWithChildren<{}>) {
  return (
    <ColorModeProvider>
      <GlobalLoadingProvider>{children}</GlobalLoadingProvider>
    </ColorModeProvider>
  )
}
