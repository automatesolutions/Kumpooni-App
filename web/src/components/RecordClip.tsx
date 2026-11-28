import React from 'react'
import {Camera, PlayerStop, Record, Refresh, ScreenShare, Send, Video} from '@/components/icons'
import {businessError} from '@/lib/business'
import {
  canRecordScreen,
  CLIP_MAX_BYTES,
  CLIP_MAX_SECONDS,
  clipTime,
  formatBytes,
  pickClipType,
  startCapture,
  type Capture,
  type ClipSource,
} from '@/lib/recorder'
import {toast} from '@/stores/ui'
import {useClipUsageQuery, useSendClipMutation} from '@/state/queries/chat'
import {Alert, Button, Dialog} from './ui'

type Stage =
  | {name: 'pick'}
  | {name: 'countdown'; n: number}
  | {name: 'recording'}
  | {name: 'review'; blob: Blob; url: string; seconds: number}

/** Record a clip of up to 2 minutes and send it to the channel. */
export function RecordClipDialog({
  open,
  onClose,
  orgId,
  channelId,
  label,
}: {
  open: boolean
  onClose: () => void
  orgId: string
  channelId: string
  label: string
}) {
  return (
    <Dialog open={open} onClose={onClose} title="Record a clip" wide>
      {open && <Recorder orgId={orgId} channelId={channelId} label={label} onClose={onClose} />}
    </Dialog>
  )
}

function Recorder({
  orgId,
  channelId,
  label,
  onClose,
}: {
  orgId: string
  channelId: string
  label: string
  onClose: () => void
}) {
  const type = React.useMemo(() => pickClipType(), [])
  const usage = useClipUsageQuery(orgId)
  const send = useSendClipMutation(orgId, channelId)
  const [source, setSource] = React.useState<ClipSource>('camera')
  const [stage, setStage] = React.useState<Stage>({name: 'pick'})
  const [elapsed, setElapsed] = React.useState(0)
  const [problem, setProblem] = React.useState('')
  const [body, setBody] = React.useState('')
  const capture = React.useRef<Capture | null>(null)
  const recorder = React.useRef<MediaRecorder | null>(null)
  const startedAt = React.useRef(0)
  const live = React.useRef<HTMLVideoElement>(null)
  const screenOk = canRecordScreen()
  const room = usage.data ? usage.data.cap_bytes - usage.data.used_bytes : null

  const release = React.useCallback(() => {
    if (recorder.current?.state === 'recording') recorder.current.stop()
    capture.current?.stop()
    capture.current = null
  }, [])
  // Closing the dialog turns the camera and screen off.
  React.useEffect(() => release, [release])
  React.useEffect(
    () => () => {
      if (stage.name === 'review') URL.revokeObjectURL(stage.url)
    },
    [stage],
  )

  const begin = async () => {
    setProblem('')
    try {
      capture.current = await startCapture(source)
    } catch (e) {
      const denied = e instanceof DOMException && e.name === 'NotAllowedError'
      setProblem(
        denied
          ? 'Allow the camera, microphone, or screen in your browser settings, then try again.'
          : "We couldn't start the camera or screen. Close other apps that use it and try again.",
      )
      return
    }
    // If you stop sharing from the browser's own bar, the clip ends there.
    capture.current.output.getVideoTracks()[0]?.addEventListener('ended', () => stop())
    if (live.current) live.current.srcObject = capture.current.preview
    for (const n of [3, 2, 1]) {
      setStage({name: 'countdown', n})
      await new Promise(r => setTimeout(r, 800))
      if (!capture.current) return
    }
    record()
  }

  const record = () => {
    if (!capture.current || !type) return
    const chunks: Blob[] = []
    const rec = new MediaRecorder(capture.current.output, {
      mimeType: type.mime,
      videoBitsPerSecond: source === 'camera' ? 1_000_000 : 1_200_000,
      audioBitsPerSecond: 64_000,
    })
    rec.ondataavailable = e => e.data.size && chunks.push(e.data)
    rec.onstop = () => {
      const seconds = (Date.now() - startedAt.current) / 1000
      const blob = new Blob(chunks, {type: type.base})
      capture.current?.stop()
      capture.current = null
      setStage({name: 'review', blob, url: URL.createObjectURL(blob), seconds})
    }
    recorder.current = rec
    startedAt.current = Date.now()
    setElapsed(0)
    rec.start(1000)
    setStage({name: 'recording'})
  }

  const stop = React.useCallback(() => {
    if (recorder.current?.state === 'recording') recorder.current.stop()
  }, [])

  // The clock, and the stop at 2 minutes.
  React.useEffect(() => {
    if (stage.name !== 'recording') return
    const t = setInterval(() => {
      const s = (Date.now() - startedAt.current) / 1000
      setElapsed(s)
      if (s >= CLIP_MAX_SECONDS) stop()
    }, 250)
    return () => clearInterval(t)
  }, [stage.name, stop])

  if (!type) {
    return <p>This browser can't record video. Try Chrome, Edge, Firefox, or Safari.</p>
  }

  if (stage.name === 'review') {
    const tooBig = stage.blob.size > CLIP_MAX_BYTES
    const noRoom = room != null && stage.blob.size > room
    return (
      <form
        className="stack"
        style={{gap: 'var(--space-4)'}}
        onSubmit={e => {
          e.preventDefault()
          send.mutate(
            {blob: stage.blob, seconds: stage.seconds, type, body},
            {
              onSuccess: () => {
                toast(`Clip sent to ${label}.`)
                onClose()
              },
            },
          )
        }}>
        <video className="clip-stage" src={stage.url} controls playsInline />
        <p className="small muted">
          {clipTime(stage.seconds)} · {formatBytes(stage.blob.size)}
        </p>
        <div className="field">
          <label className="label" htmlFor="clip-note">
            Add a message <span className="muted">(optional)</span>
          </label>
          <input
            id="clip-note"
            className="input"
            maxLength={4000}
            value={body}
            placeholder="Here's what the noise sounds like"
            onChange={e => setBody(e.target.value)}
          />
        </div>
        {tooBig && <Alert>This clip is larger than 25 MB. Record a shorter one.</Alert>}
        {!tooBig && noRoom && <Alert>Your shop's clip storage is full. Delete old clips in chat to make room.</Alert>}
        {send.error && <Alert>{businessError(send.error, "We couldn't send the clip. Try again.")}</Alert>}
        <div className="dlg__foot">
          <Button
            type="button"
            variant="ghost"
            disabled={send.isPending}
            onClick={() => {
              setBody('')
              setStage({name: 'pick'})
            }}>
            <Refresh size={18} aria-hidden /> Record again
          </Button>
          <Button type="submit" loading={send.isPending} disabled={tooBig || noRoom}>
            <Send size={18} aria-hidden /> Send clip
          </Button>
        </div>
      </form>
    )
  }

  const busy = stage.name !== 'pick'
  return (
    <div className="stack" style={{gap: 'var(--space-4)'}}>
      <div className="clip-stage-wrap">
        <video
          ref={live}
          className={`clip-stage${source === 'camera' ? ' clip-stage--mirror' : ''}`}
          autoPlay
          muted
          playsInline
          hidden={!busy}
        />
        {!busy && (
          <div className="clip-stage clip-stage--empty">
            <Video size={40} aria-hidden />
            <p className="small muted">Show the problem, walk through a job, or explain a quote. Up to 2 minutes.</p>
          </div>
        )}
        {stage.name === 'countdown' && (
          <span className="clip-count" aria-live="assertive">
            {stage.n}
          </span>
        )}
        {stage.name === 'recording' && (
          <span className="clip-rec" role="timer" aria-live="off">
            <span className="clip-rec__dot" aria-hidden /> {clipTime(elapsed)} / {clipTime(CLIP_MAX_SECONDS)}
          </span>
        )}
      </div>

      {stage.name === 'pick' && (
        <fieldset className="field" style={{border: 0, padding: 0, margin: 0}}>
          <legend className="label" style={{marginBottom: 'var(--space-2)'}}>
            What to record
          </legend>
          <div className="chips chips--wrap" role="radiogroup">
            <SourceChip value="camera" current={source} onPick={setSource} icon={<Camera size={16} aria-hidden />}>
              Camera
            </SourceChip>
            {screenOk && (
              <>
                <SourceChip
                  value="screen"
                  current={source}
                  onPick={setSource}
                  icon={<ScreenShare size={16} aria-hidden />}>
                  Screen
                </SourceChip>
                <SourceChip value="both" current={source} onPick={setSource} icon={<Video size={16} aria-hidden />}>
                  Screen and camera
                </SourceChip>
              </>
            )}
          </div>
          {!screenOk && <p className="help">Screen recording works on a computer.</p>}
        </fieldset>
      )}

      {problem && <Alert>{problem}</Alert>}
      {usage.data && (
        <p className="xsmall muted">
          Your shop has used {formatBytes(usage.data.used_bytes)} of {formatBytes(usage.data.cap_bytes)} for clips.
        </p>
      )}

      <div className="dlg__foot">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        {stage.name === 'recording' ? (
          <Button type="button" variant="danger" onClick={stop}>
            <PlayerStop size={18} aria-hidden /> Stop
          </Button>
        ) : (
          <Button type="button" onClick={begin} disabled={busy || (room != null && room <= 0)}>
            <Record size={18} aria-hidden /> Start recording
          </Button>
        )}
      </div>
    </div>
  )
}

function SourceChip({
  value,
  current,
  onPick,
  icon,
  children,
}: {
  value: ClipSource
  current: ClipSource
  onPick: (v: ClipSource) => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button type="button" role="radio" className="chip" aria-checked={current === value} onClick={() => onPick(value)}>
      {icon} {children}
    </button>
  )
}

/**
 * Plays a clip. Chrome saves WebM recordings without a length, so the bar can't seek until
 * the player has read to the end once. This asks it to, then goes back to the start.
 */
export function ClipPlayer({src, label}: {src: string; label: string}) {
  const ref = React.useRef<HTMLVideoElement>(null)
  return (
    <video
      ref={ref}
      className="chat__clip"
      src={src}
      controls
      playsInline
      preload="metadata"
      aria-label={label}
      onLoadedMetadata={e => {
        const v = e.currentTarget
        if (v.duration === Infinity) {
          v.currentTime = 1e7
          v.ontimeupdate = () => {
            v.ontimeupdate = null
            v.currentTime = 0
          }
        }
      }}
    />
  )
}
