// Video clips for chat (supabase/12-business-clips.sql): record your camera, your screen, or
// your screen with your camera in a corner, for up to 2 minutes. Everything happens in the
// browser with MediaRecorder. Nothing is sent until you press Send.

export const CLIP_MAX_SECONDS = 120
export const CLIP_MAX_BYTES = 25 * 1024 * 1024
export const CLIP_BUCKET = 'shop-clips'

export type ClipSource = 'camera' | 'screen' | 'both'
export type ClipType = {mime: string; base: 'video/webm' | 'video/mp4'; ext: 'webm' | 'mp4'}

/** The best format this browser records: WebM in Chrome and Firefox, MP4 in Safari. */
export function pickClipType(isSupported = (t: string) => MediaRecorder.isTypeSupported(t)): ClipType | null {
  const options: ClipType[] = [
    {mime: 'video/webm;codecs=vp9,opus', base: 'video/webm', ext: 'webm'},
    {mime: 'video/webm;codecs=vp8,opus', base: 'video/webm', ext: 'webm'},
    {mime: 'video/webm', base: 'video/webm', ext: 'webm'},
    {mime: 'video/mp4;codecs=avc1,mp4a', base: 'video/mp4', ext: 'mp4'},
    {mime: 'video/mp4', base: 'video/mp4', ext: 'mp4'},
  ]
  return options.find(o => isSupported(o.mime)) ?? null
}

export const canRecord = () =>
  typeof window !== 'undefined' &&
  'MediaRecorder' in window &&
  !!navigator.mediaDevices?.getUserMedia &&
  !!pickClipType()

export const canRecordScreen = () => canRecord() && !!navigator.mediaDevices?.getDisplayMedia

/** 0:07, 1:59. */
export function clipTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** 4.2 MB. */
export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`
}

/** Where the camera bubble goes on a screen recording: bottom left, a fifth of the height. */
export function bubbleRect(width: number, height: number) {
  const size = Math.round(Math.min(width, height) / 5)
  const margin = Math.round(height / 30)
  return {x: margin, y: height - size - margin, size}
}

export type Capture = {
  /** What you see while recording. */
  preview: MediaStream
  /** What gets recorded. */
  output: MediaStream
  stop: () => void
}

/** Asks for the camera, screen, and microphone, and builds the stream to record. */
export async function startCapture(source: ClipSource): Promise<Capture> {
  const stops: (() => void)[] = []
  const stopAll = () => stops.forEach(f => f())
  try {
    const mic = await navigator.mediaDevices
      .getUserMedia({audio: {echoCancellation: true, noiseSuppression: true}})
      .catch(() => null)
    if (mic) stops.push(() => mic.getTracks().forEach(t => t.stop()))
    const audio = mic?.getAudioTracks() ?? []

    if (source === 'camera') {
      const cam = await navigator.mediaDevices.getUserMedia({
        video: {width: {ideal: 1280}, height: {ideal: 720}, facingMode: 'user'},
      })
      stops.push(() => cam.getTracks().forEach(t => t.stop()))
      const output = new MediaStream([...cam.getVideoTracks(), ...audio])
      return {preview: cam, output, stop: stopAll}
    }

    const display = await navigator.mediaDevices.getDisplayMedia({video: {frameRate: {ideal: 24}}, audio: false})
    stops.push(() => display.getTracks().forEach(t => t.stop()))
    if (source === 'screen') {
      const output = new MediaStream([...display.getVideoTracks(), ...audio])
      return {preview: display, output, stop: stopAll}
    }

    // Screen with your camera in a round bubble, drawn together on a canvas.
    const cam = await navigator.mediaDevices.getUserMedia({video: {width: {ideal: 480}, height: {ideal: 480}}})
    stops.push(() => cam.getTracks().forEach(t => t.stop()))
    const screenVideo = await playing(display)
    const camVideo = await playing(cam)
    const settings = display.getVideoTracks()[0].getSettings()
    const scale = Math.min(1, 1280 / (settings.width ?? 1280))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round((settings.width ?? 1280) * scale)
    canvas.height = Math.round((settings.height ?? 720) * scale)
    const ctx = canvas.getContext('2d')!
    const {x, y, size} = bubbleRect(canvas.width, canvas.height)
    const draw = () => {
      ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height)
      const vw = camVideo.videoWidth || 1
      const vh = camVideo.videoHeight || 1
      const crop = Math.min(vw, vh)
      ctx.save()
      ctx.beginPath()
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
      ctx.clip()
      // Mirrored, like a mirror, so it matches what you expect to see.
      ctx.translate(x + size, y)
      ctx.scale(-1, 1)
      ctx.drawImage(camVideo, (vw - crop) / 2, (vh - crop) / 2, crop, crop, 0, 0, size, size)
      ctx.restore()
    }
    // A worker keeps the timer running while you're on another tab, which is the point of
    // recording your screen. Timers on the page itself slow down there.
    const worker = new Worker(
      URL.createObjectURL(new Blob(['setInterval(() => postMessage(0), 1000 / 24)'], {type: 'text/javascript'})),
    )
    worker.onmessage = draw
    stops.push(() => worker.terminate())
    const output = new MediaStream([...canvas.captureStream(24).getVideoTracks(), ...audio])
    stops.push(() => output.getVideoTracks().forEach(t => t.stop()))
    return {preview: output, output, stop: stopAll}
  } catch (e) {
    stopAll()
    throw e
  }
}

async function playing(stream: MediaStream) {
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.srcObject = stream
  await video.play()
  return video
}
