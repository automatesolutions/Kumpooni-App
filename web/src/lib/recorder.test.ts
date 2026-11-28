import {describe, expect, it} from 'vitest'
import {bubbleRect, clipTime, formatBytes, pickClipType} from './recorder'

describe('pickClipType', () => {
  it('prefers WebM, and falls back to MP4 on Safari', () => {
    expect(pickClipType(t => t.startsWith('video/webm'))?.mime).toBe('video/webm;codecs=vp9,opus')
    expect(pickClipType(t => t === 'video/mp4')).toEqual({mime: 'video/mp4', base: 'video/mp4', ext: 'mp4'})
    expect(pickClipType(() => false)).toBeNull()
  })
})

describe('clipTime and formatBytes', () => {
  it('shows times and sizes the way people read them', () => {
    expect(clipTime(7)).toBe('0:07')
    expect(clipTime(119.6)).toBe('1:59')
    expect(formatBytes(500)).toBe('1 KB')
    expect(formatBytes(4.2 * 1024 * 1024)).toBe('4.2 MB')
    expect(formatBytes(18 * 1024 * 1024)).toBe('18 MB')
  })
})

describe('bubbleRect', () => {
  it('keeps the camera bubble inside the bottom left corner', () => {
    const r = bubbleRect(1280, 720)
    expect(r.size).toBe(144)
    expect(r.x).toBeGreaterThan(0)
    expect(r.y + r.size).toBeLessThan(720)
  })
})
