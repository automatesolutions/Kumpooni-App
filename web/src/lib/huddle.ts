// Huddles (supabase/11-business-huddles.sql): voice and camera calls for up to 4 people.
//
// Each person connects straight to each other person (a mesh of WebRTC connections), so
// sound and video never pass through Kumpooni. The database only carries the setup messages
// (offer, answer, ice) and who is in the call. Google's free STUN server helps browsers find
// each other. Some strict networks need a relay (TURN), which costs money, so it's off for now.
//
// The call lives here, outside React, so it keeps going while you move between pages.
// React reads it through useHuddleStore.
import {create} from 'zustand'
import type {RealtimeChannel} from '@supabase/supabase-js'
import {supabase} from './supabase'
import {SUPABASE_ANON_KEY, SUPABASE_URL} from './env'
import type {HuddlePersonRow, HuddleSignalRow} from '@/types/business'

export const HUDDLE_MAX = 4
const ICE_SERVERS: RTCIceServer[] = [{urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302']}]
const PING_MS = 15_000

export type MediaState = {mic: boolean; cam: boolean; screen: boolean}

export type Peer = {
  userId: string
  stream: MediaStream
  media: MediaState
  connection: RTCPeerConnectionState
}

export type HuddleState = {
  status: 'idle' | 'joining' | 'live'
  orgId: string | null
  channelId: string | null
  /** Where the call is, such as "#general". */
  label: string
  huddleId: string | null
  startedAt: number | null
  local: MediaStream | null
  media: MediaState
  peers: Record<string, Peer>
  error: string | null
}

const IDLE: HuddleState = {
  status: 'idle',
  orgId: null,
  channelId: null,
  label: '',
  huddleId: null,
  startedAt: null,
  local: null,
  media: {mic: false, cam: false, screen: false},
  peers: {},
  error: null,
}

export const useHuddleStore = create<HuddleState>()(() => ({...IDLE}))
const set = (patch: Partial<HuddleState> | ((s: HuddleState) => Partial<HuddleState>)) => useHuddleStore.setState(patch)
const get = () => useHuddleStore.getState()

/** True when this browser can make calls at all. */
export const canHuddle = () =>
  typeof window !== 'undefined' && 'RTCPeerConnection' in window && !!navigator.mediaDevices?.getUserMedia

/** True when this browser can share its screen (desktop browsers, not phones). */
export const canShareScreen = () => typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getDisplayMedia

// ---------- Private state of the current call ----------

type Link = {pc: RTCPeerConnection; pendingIce: RTCIceCandidateInit[]; stream: MediaStream}

let me: string | null = null
let links = new Map<string, Link>()
let signals: RealtimeChannel | null = null
let roster: RealtimeChannel | null = null
let ping: ReturnType<typeof setInterval> | null = null
let mic: MediaStreamTrack | null = null
let cam: MediaStreamTrack | null = null
let screen: MediaStreamTrack | null = null
/** Kept fresh while in a call, for leaveOnClose(). */
let accessToken: string | null = null
const refreshToken = async () => {
  accessToken = (await supabase.auth.getSession()).data.session?.access_token ?? null
}

async function send(to: string, kind: HuddleSignalRow['kind'], payload: Record<string, unknown>) {
  const huddleId = get().huddleId
  if (!huddleId) return
  const {error} = await supabase.from('huddle_signals').insert({huddle_id: huddleId, to_user: to, kind, payload})
  if (error && !/not_in_huddle/.test(error.message)) console.warn('[huddle] signal failed', error.message)
}

/** The track others see: your screen while sharing, otherwise your camera, or nothing. */
const videoTrack = () => screen ?? cam

function refreshLocal() {
  const tracks = [mic, videoTrack()].filter((t): t is MediaStreamTrack => !!t)
  set({local: tracks.length ? new MediaStream(tracks) : null})
}

function setPeer(userId: string, patch: Partial<Peer>) {
  set(s => {
    const current = s.peers[userId] ?? {
      userId,
      stream: links.get(userId)?.stream ?? new MediaStream(),
      media: {mic: true, cam: false, screen: false},
      connection: 'new' as RTCPeerConnectionState,
    }
    return {peers: {...s.peers, [userId]: {...current, ...patch}}}
  })
}

function dropPeer(userId: string) {
  links.get(userId)?.pc.close()
  links.delete(userId)
  set(s => {
    const {[userId]: _gone, ...rest} = s.peers
    return {peers: rest}
  })
}

/** One connection to one person, with a fixed audio slot and a fixed video slot. */
function connect(userId: string, offerer: boolean) {
  links.get(userId)?.pc.close()
  const pc = new RTCPeerConnection({iceServers: ICE_SERVERS})
  const stream = new MediaStream()
  const link: Link = {pc, pendingIce: [], stream}
  links.set(userId, link)

  if (offerer) {
    // Turning the camera or screen on later swaps the track in this slot, with no new setup.
    pc.addTransceiver('audio', {direction: 'sendrecv'}).sender.replaceTrack(mic)
    pc.addTransceiver('video', {direction: 'sendrecv'}).sender.replaceTrack(videoTrack())
  }
  pc.onicecandidate = e => {
    if (e.candidate) void send(userId, 'ice', e.candidate.toJSON() as Record<string, unknown>)
  }
  pc.ontrack = e => {
    // A new stream object each time, so screens showing it notice the new track.
    if (!link.stream.getTracks().includes(e.track)) link.stream = new MediaStream([...link.stream.getTracks(), e.track])
    setPeer(userId, {stream: link.stream})
  }
  pc.onconnectionstatechange = () => {
    setPeer(userId, {connection: pc.connectionState})
    if (pc.connectionState === 'connected') void send(userId, 'state', get().media)
    if (pc.connectionState === 'failed' || pc.connectionState === 'closed') dropPeer(userId)
  }
  setPeer(userId, {stream, connection: 'new'})
  return link
}

async function flushIce(link: Link) {
  for (const c of link.pendingIce.splice(0)) await link.pc.addIceCandidate(c).catch(() => {})
}

async function onSignal(row: HuddleSignalRow) {
  if (row.huddle_id !== get().huddleId || row.from_user === me) return
  const from = row.from_user
  try {
    if (row.kind === 'offer') {
      // A new offer from someone means they (re)joined. Start a fresh connection.
      const link = connect(from, false)
      await link.pc.setRemoteDescription(row.payload as unknown as RTCSessionDescriptionInit)
      const [audio, video] = link.pc.getTransceivers()
      if (audio) {
        audio.direction = 'sendrecv'
        await audio.sender.replaceTrack(mic)
      }
      if (video) {
        video.direction = 'sendrecv'
        await video.sender.replaceTrack(videoTrack())
      }
      await link.pc.setLocalDescription(await link.pc.createAnswer())
      await send(from, 'answer', link.pc.localDescription!.toJSON() as unknown as Record<string, unknown>)
      await flushIce(link)
    } else if (row.kind === 'answer') {
      const link = links.get(from)
      if (!link || link.pc.signalingState !== 'have-local-offer') return
      await link.pc.setRemoteDescription(row.payload as unknown as RTCSessionDescriptionInit)
      await flushIce(link)
    } else if (row.kind === 'ice') {
      const link = links.get(from)
      if (!link) return
      if (link.pc.remoteDescription) await link.pc.addIceCandidate(row.payload as RTCIceCandidateInit).catch(() => {})
      else link.pendingIce.push(row.payload as RTCIceCandidateInit)
    } else if (row.kind === 'state') {
      setPeer(from, {media: row.payload as unknown as MediaState})
    }
  } catch (e) {
    console.warn('[huddle] setup failed', e)
  }
}

async function callPerson(userId: string) {
  const link = connect(userId, true)
  await link.pc.setLocalDescription(await link.pc.createOffer())
  await send(userId, 'offer', link.pc.localDescription!.toJSON() as unknown as Record<string, unknown>)
}

function broadcastMedia() {
  const media = get().media
  for (const userId of links.keys()) void send(userId, 'state', media)
}

async function swapVideo() {
  for (const {pc} of links.values()) {
    const video = pc.getTransceivers()[1]
    if (video) await video.sender.replaceTrack(videoTrack()).catch(() => {})
  }
  refreshLocal()
}

function subscribe(huddleId: string): Promise<void> {
  return new Promise(resolve => {
    signals = supabase
      .channel(`huddle-signals:${huddleId}:${me}`)
      .on(
        'postgres_changes',
        {event: 'INSERT', schema: 'public', table: 'huddle_signals', filter: `to_user=eq.${me}`},
        p => onSignal(p.new as HuddleSignalRow),
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') resolve()
      })
    roster = supabase
      .channel(`huddle-people:${huddleId}:${me}`)
      .on(
        'postgres_changes',
        {event: 'UPDATE', schema: 'public', table: 'huddle_people', filter: `huddle_id=eq.${huddleId}`},
        p => {
          const row = p.new as HuddlePersonRow
          if (row.left_at && row.user_id !== me) dropPeer(row.user_id)
        },
      )
      .subscribe()
  })
}

function teardown() {
  for (const userId of [...links.keys()]) dropPeer(userId)
  links = new Map()
  for (const t of [mic, cam, screen]) t?.stop()
  mic = cam = screen = null
  if (signals) void supabase.removeChannel(signals)
  if (roster) void supabase.removeChannel(roster)
  signals = roster = null
  if (ping) clearInterval(ping)
  ping = null
  window.removeEventListener('pagehide', leaveOnClose)
}

/** Closing the tab still tells the others you left, so they don't wait 45 seconds. */
function leaveOnClose() {
  const huddleId = get().huddleId
  const access = accessToken
  if (!huddleId || !access || !SUPABASE_URL || !SUPABASE_ANON_KEY) return
  void fetch(`${SUPABASE_URL}/rest/v1/rpc/leave_huddle`, {
    method: 'POST',
    keepalive: true,
    headers: {apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${access}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({p_huddle: huddleId}),
  })
}

// ---------- What the screens call ----------

export async function joinHuddle(opts: {orgId: string; channelId: string; label: string; userId: string}) {
  if (get().status !== 'idle') {
    if (get().channelId === opts.channelId) return
    await leaveHuddle()
  }
  me = opts.userId
  set({...IDLE, status: 'joining', orgId: opts.orgId, channelId: opts.channelId, label: opts.label})
  try {
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: {echoCancellation: true, noiseSuppression: true, autoGainControl: true},
      })
      mic = media.getAudioTracks()[0] ?? null
    } catch {
      set({error: 'Your microphone is off, so you can listen but not talk. Allow it in the browser to talk.'})
    }
    const {data, error} = await supabase.rpc('join_huddle', {p_channel: opts.channelId})
    if (error) throw error
    const {huddle_id: huddleId, others} = data[0]
    set({huddleId, status: 'live', startedAt: Date.now(), media: {mic: !!mic, cam: false, screen: false}})
    refreshLocal()
    await subscribe(huddleId)
    await Promise.all(others.map(callPerson))
    await refreshToken()
    ping = setInterval(async () => {
      void refreshToken()
      const {data: still} = await supabase.rpc('huddle_ping', {p_huddle: huddleId})
      if (still === false) {
        teardown()
        set({...IDLE})
      }
    }, PING_MS)
    window.addEventListener('pagehide', leaveOnClose)
  } catch (e) {
    teardown()
    set({...IDLE})
    throw e
  }
}

export async function leaveHuddle() {
  const huddleId = get().huddleId
  teardown()
  set({...IDLE})
  if (huddleId) await supabase.rpc('leave_huddle', {p_huddle: huddleId})
}

export function toggleMic() {
  if (!mic) return false
  mic.enabled = !mic.enabled
  set(s => ({media: {...s.media, mic: mic!.enabled}}))
  broadcastMedia()
  return true
}

export async function toggleCamera() {
  if (cam) {
    cam.stop()
    cam = null
  } else {
    const media = await navigator.mediaDevices.getUserMedia({
      video: {width: {ideal: 640}, height: {ideal: 480}, frameRate: {ideal: 24}, facingMode: 'user'},
    })
    cam = media.getVideoTracks()[0] ?? null
  }
  set(s => ({media: {...s.media, cam: !!cam}}))
  await swapVideo()
  broadcastMedia()
}

export async function toggleScreen() {
  if (screen) {
    screen.stop()
    screen = null
  } else {
    const media = await navigator.mediaDevices.getDisplayMedia({video: {frameRate: {ideal: 15}}, audio: false})
    screen = media.getVideoTracks()[0] ?? null
    // The browser's own "Stop sharing" button.
    if (screen) screen.onended = () => void toggleScreen()
  }
  set(s => ({media: {...s.media, screen: !!screen}}))
  await swapVideo()
  broadcastMedia()
}
