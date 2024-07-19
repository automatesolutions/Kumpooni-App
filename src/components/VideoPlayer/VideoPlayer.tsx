import {StyleSheet, View} from 'react-native'
import VideoPlayer from 'react-native-media-console'
import {atoms as a} from '#/theme'
import React from 'react'
export function Video() {
  const player = React.useRef<any>(null)
  return (
    <View style={[a.px_sm, a.flex_1, a.py_sm]}>
      <VideoPlayer
        //@ts-ignore
        source={{
          uri: 'https://vheyzzpdmmyiejsxerzg.supabase.co/storage/v1/object/public/video/GDpzjRlb_byFHQYEAB4-q828kZ1CbmdjAAAF.mp4',
        }} // Can be a URL or a local file.
        videoStyle={styles.backgroundVideo}
        resizeMode="contain"
        repeat={false}
        poster={
          'https://absfenzewxaailbouqts.supabase.co/storage/v1/object/public/image/byd-thumbnail.png'
        }
        paused={true}
        onLoad={() => {
          player.current?.seek(1000) // this will set first frame of video as thumbnail
        }}
        containerStyle={{
          flex: 0,
          height: 200,
          width: '100%',
          borderRadius: 7,
        }}
        showTimeRemaining
        disableBack={true}
        disableSeekButtons
        disableOverlay
        disableFullscreen
        isFullscreen={true}
        tapAnywhereToPause
      />
    </View>
  )
}

const styles = StyleSheet.create({
  backgroundVideo: {
    backgroundColor: 'transparent',
    padding: 0,
    margin: 0,
  },
})
