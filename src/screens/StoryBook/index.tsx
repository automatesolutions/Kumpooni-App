import {StyleSheet, View} from 'react-native'
import {useSetThemePrefs} from '#/state/shell'
import {useTheme, atoms as a} from '#/theme'

import {Text} from '#/components/Typography'

export function StoryBook() {
  const t = useTheme()
  const {setColorMode, setDarkTheme} = useSetThemePrefs()

  // return (
  //   <ScrollView>
  //     <CenteredView style={[t.atoms.bg]}>

  //     </CenteredView>
  //   </ScrollView>
  // )
  console.log('StoryBookRerender')
  return (
    <View style={[a.flex_1, t.atoms.bg]}>
      <View style={[a.flex_1, a.align_start]}>
        <Text style={styles.dbxlNormal}>This text uses a DBXL sand font</Text>
        <Text style={styles.dbxlExtraWide}>
          This text uses a DBXL sand light font
        </Text>
        <Text style={styles.normalText}>
          This text uses a DBXL sand light font
        </Text>
        <Text style={styles.interBold}>This text uses Inter Bold font</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  interBold: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  dbxlNormal: {
    fontFamily: 'DBXLN-ExtraWide',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dbxlExtraWide: {
    fontFamily: 'DBXLN-Normal',
    fontSize: 16,
  },
  normalText: {
    fontSize: 16,
  },
})

{
  /* <View style={[a.p_xl, a.gap_5xl, { paddingBottom: 200 }]}>
          <View style={[a.flex_row, a.align_start, a.gap_md]}>
            <Button
              variant="outline"
              color="primary"
              size="small"
              label='Set theme to "system"'
              onPress={() => setColorMode('system')}>
              System
            </Button>
            <Button
              variant="solid"
              color="secondary"
              size="small"
              label='Set theme to "light"'
              onPress={() => setColorMode('light')}>
              Light
            </Button>
            <Button
              variant="solid"
              color="secondary"
              size="small"
              label='Set theme to "dim"'
              onPress={() => {
                setColorMode('dark')
                setDarkTheme('dim')
              }}>
              Dim
            </Button>
            <Button
              variant="solid"
              color="secondary"
              size="small"
              label='Set theme to "dark"'
              onPress={() => {
                setColorMode('dark')
                setDarkTheme('dark')
              }}>
              Dark
            </Button>
          </View>
        </View>
        <Buttons /> */
}
