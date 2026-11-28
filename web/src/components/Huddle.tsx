import React from 'react'
import {useQueryClient} from '@tanstack/react-query'
import {
  ChevronLeft,
  Headphones,
  Microphone,
  MicrophoneOff,
  PhoneOff,
  ScreenShare,
  ScreenShareOff,
  Video,
  VideoOff,
} from '@/components/icons'
import {businessError} from '@/lib/business'
import {
  canHuddle,
  canShareScreen,
  HUDDLE_MAX,
  joinHuddle,
  leaveHuddle,
  toggleCamera,
  toggleMic,
  toggleScreen,
  useHuddleStore,
  type Peer,
} from '@/lib/huddle'
import {toast} from '@/stores/ui'
import {useUserId} from '@/state/session'
import {useChatPeopleQuery} from '@/state/queries/chat'
import {useShopHuddlesQuery} from '@/state/queries/huddles'
import type {ChatPerson} from '@/types/business'
import {Button} from './ui'

/** "Start a huddle", or "Join" with who is in it. Goes in a chat channel's header. */
export function HuddleButton({
  orgId,
  channelId,
  label,
  archived,
}: {
  orgId: string
  channelId: string
  label: string
  archived?: boolean
}) {
  const userId = useUserId()
  const qc = useQueryClient()
  const {data: live} = useShopHuddlesQuery(orgId)
  const {data: people = []} = useChatPeopleQuery(orgId)
  const status = useHuddleStore(s => (s.channelId === channelId ? s.status : 'idle'))
  const call = live?.find(h => h.channel_id === channelId)
  const [busy, setBusy] = React.useState(false)
  if (!canHuddle() || archived) return null

  const join = async () => {
    if (!userId) return
    setBusy(true)
    try {
      await joinHuddle({orgId, channelId, label, userId})
      void qc.invalidateQueries({queryKey: ['huddles', orgId]})
    } catch (e) {
      toast(businessError(e, "We couldn't start the huddle. Try again."), 'error')
    } finally {
      setBusy(false)
    }
  }

  if (status !== 'idle') {
    return (
      <span className="huddle-pill huddle-pill--on" role="status">
        <Headphones size={16} aria-hidden /> You're in the huddle
      </span>
    )
  }
  if (call) {
    const full = call.people.length >= HUDDLE_MAX
    return (
      <Button size="sm" onClick={join} loading={busy} disabled={full} className="huddle-join">
        <Faces ids={call.people} people={people} />
        {full ? 'Huddle is full' : 'Join huddle'}
      </Button>
    )
  }
  return (
    <Button size="sm" variant="ghost" onClick={join} loading={busy} aria-label={`Start a huddle in ${label}`}>
      <Headphones size={18} aria-hidden /> <span className="huddle-start__text">Huddle</span>
    </Button>
  )
}

function Faces({ids, people}: {ids: string[]; people: ChatPerson[]}) {
  return (
    <span className="huddle-faces" aria-hidden>
      {ids.slice(0, 3).map(id => (
        <span key={id} className="huddle-face">
          {(people.find(p => p.user_id === id)?.name[0] ?? '?').toUpperCase()}
        </span>
      ))}
    </span>
  )
}

/**
 * The call you're in, on every page. It floats above the content, and you can make it
 * small. Mounted once, in Layout.
 */
export function HuddleDock() {
  const s = useHuddleStore()
  const userId = useUserId()
  const {data: people = []} = useChatPeopleQuery(s.orgId ?? '')
  const [small, setSmall] = React.useState(false)
  const elapsed = useElapsed(s.startedAt)
  if (s.status === 'idle') return null

  const name = (id: string | null) => people.find(p => p.user_id === id)?.name ?? 'Teammate'
  const peers = Object.values(s.peers)
  const count = peers.length + 1

  const run = (fn: () => Promise<unknown> | unknown, what: string) => async () => {
    try {
      await fn()
    } catch (e) {
      const denied = e instanceof DOMException && e.name === 'NotAllowedError'
      toast(
        denied ? `Allow the ${what} in your browser settings, then try again.` : `We couldn't turn on the ${what}.`,
        'error',
      )
    }
  }

  return (
    <aside className={`huddle${small ? ' huddle--small' : ''}`} aria-label={`Huddle in ${s.label}`}>
      <header className="huddle__head">
        <span className="huddle__live" aria-hidden />
        <p className="huddle__title">
          <span className="strong">Huddle in {s.label}</span>
          <span className="xsmall muted">
            {s.status === 'joining' ? 'Joining' : `${count} ${count === 1 ? 'person' : 'people'} · ${elapsed}`}
          </span>
        </p>
        <button
          type="button"
          className="icon-btn"
          aria-label={small ? 'Show the huddle' : 'Make the huddle small'}
          aria-expanded={!small}
          onClick={() => setSmall(v => !v)}>
          <ChevronLeft size={18} style={{transform: small ? 'rotate(90deg)' : 'rotate(-90deg)'}} />
        </button>
      </header>

      {!small && (
        <>
          <ul className={`huddle__tiles huddle__tiles--${Math.min(count, 4)}`}>
            <Tile
              name={`${name(userId)} (you)`}
              stream={s.local}
              video={s.media.cam || s.media.screen}
              mic={s.media.mic}
              mirror={s.media.cam && !s.media.screen}
              self
            />
            {peers.map(p => (
              <PeerTile key={p.userId} peer={p} name={name(p.userId)} />
            ))}
          </ul>
          {s.error && <p className="xsmall muted huddle__note">{s.error}</p>}
          {count === 1 && s.status === 'live' && (
            <p className="xsmall muted huddle__note">
              You're the only one here. Teammates see a Join button in the channel.
            </p>
          )}
        </>
      )}

      <div className="huddle__controls" role="group" aria-label="Huddle controls">
        <button
          type="button"
          className={`huddle__ctl${s.media.mic ? '' : ' huddle__ctl--off'}`}
          aria-pressed={!s.media.mic}
          aria-label={s.media.mic ? 'Mute' : 'Unmute'}
          onClick={() => {
            if (!toggleMic()) toast('Allow the microphone in your browser settings, then join again.', 'error')
          }}>
          {s.media.mic ? <Microphone size={20} /> : <MicrophoneOff size={20} />}
        </button>
        {!small && (
          <>
            <button
              type="button"
              className={`huddle__ctl${s.media.cam ? ' huddle__ctl--on' : ''}`}
              aria-pressed={s.media.cam}
              aria-label={s.media.cam ? 'Turn camera off' : 'Turn camera on'}
              onClick={run(toggleCamera, 'camera')}>
              {s.media.cam ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            {canShareScreen() && (
              <button
                type="button"
                className={`huddle__ctl${s.media.screen ? ' huddle__ctl--on' : ''}`}
                aria-pressed={s.media.screen}
                aria-label={s.media.screen ? 'Stop sharing your screen' : 'Share your screen'}
                onClick={run(toggleScreen, 'screen sharing')}>
                {s.media.screen ? <ScreenShareOff size={20} /> : <ScreenShare size={20} />}
              </button>
            )}
          </>
        )}
        <button type="button" className="huddle__ctl huddle__ctl--leave" onClick={() => void leaveHuddle()}>
          <PhoneOff size={20} aria-hidden /> <span>Leave</span>
        </button>
      </div>
    </aside>
  )
}

function PeerTile({peer, name}: {peer: Peer; name: string}) {
  const audio = React.useRef<HTMLAudioElement>(null)
  React.useEffect(() => {
    if (audio.current && audio.current.srcObject !== peer.stream) audio.current.srcObject = peer.stream
  }, [peer.stream])
  const connecting = peer.connection !== 'connected'
  return (
    <>
      <Tile
        name={name}
        stream={peer.stream}
        video={peer.media.cam || peer.media.screen}
        mic={peer.media.mic}
        note={connecting ? 'Connecting' : undefined}
      />
      {/* Sound plays here, separate from the picture, so it keeps playing with the camera off. */}
      <audio ref={audio} autoPlay />
    </>
  )
}

function Tile({
  name,
  stream,
  video,
  mic,
  mirror,
  self,
  note,
}: {
  name: string
  stream: MediaStream | null
  video: boolean
  mic: boolean
  mirror?: boolean
  self?: boolean
  note?: string
}) {
  const ref = React.useRef<HTMLVideoElement>(null)
  React.useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) ref.current.srcObject = stream
  }, [stream, video])
  const speaking = useSpeaking(self || !mic ? null : stream)
  return (
    <li className={`huddle-tile${speaking ? ' huddle-tile--speaking' : ''}`}>
      {video && stream ? (
        <video ref={ref} autoPlay playsInline muted className={mirror ? 'huddle-tile__mirror' : undefined} />
      ) : (
        <span className="huddle-tile__face" aria-hidden>
          {name[0]?.toUpperCase()}
        </span>
      )}
      <span className="huddle-tile__name">
        {!mic && <MicrophoneOff size={14} aria-label="Muted" role="img" />}
        {name}
        {note && <span className="muted"> · {note}</span>}
      </span>
    </li>
  )
}

/** Time since the call started, as m:ss. */
function useElapsed(since: number | null) {
  const [now, setNow] = React.useState(Date.now())
  React.useEffect(() => {
    if (!since) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [since])
  if (!since) return '0:00'
  const sec = Math.max(0, Math.floor((now - since) / 1000))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const ss = String(sec % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

/** True while someone is talking, from the loudness of their sound. */
function useSpeaking(stream: MediaStream | null) {
  const [speaking, setSpeaking] = React.useState(false)
  React.useEffect(() => {
    const track = stream?.getAudioTracks()[0]
    if (!track || typeof AudioContext === 'undefined') return
    const ctx = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 512
    ctx.createMediaStreamSource(new MediaStream([track])).connect(analyser)
    const data = new Uint8Array(analyser.frequencyBinCount)
    const t = setInterval(() => {
      analyser.getByteFrequencyData(data)
      const level = data.reduce((a, b) => a + b, 0) / data.length
      setSpeaking(level > 18)
    }, 200)
    return () => {
      clearInterval(t)
      void ctx.close()
    }
  }, [stream])
  return speaking
}
