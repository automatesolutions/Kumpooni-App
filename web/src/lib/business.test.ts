import {describe, expect, it} from 'vitest'
import {
  ASSIGNABLE_ROLES,
  businessError,
  canManageTeam,
  isClaimablePlaceId,
  isDtiBnNumber,
  memberActions,
  roleAtLeast,
  SHOP_CATEGORIES,
} from './business'
import {ITEM_KINDS} from './kinds'

describe('roles', () => {
  it('ranks owner > admin > member > guest', () => {
    expect(roleAtLeast('owner', 'admin')).toBe(true)
    expect(roleAtLeast('admin', 'admin')).toBe(true)
    expect(roleAtLeast('member', 'admin')).toBe(false)
    expect(roleAtLeast('guest', 'member')).toBe(false)
    expect(roleAtLeast(null, 'guest')).toBe(false)
  })

  it('lets only owners and admins manage the team', () => {
    expect(canManageTeam('owner')).toBe(true)
    expect(canManageTeam('admin')).toBe(true)
    expect(canManageTeam('member')).toBe(false)
    expect(canManageTeam('guest')).toBe(false)
  })

  it('never offers owner as a role to give', () => {
    expect(ASSIGNABLE_ROLES).not.toContain('owner')
  })
})

describe('member actions', () => {
  const owner = {userId: 'o', role: 'owner' as const}
  const admin = {userId: 'a', role: 'admin' as const}
  const member = {userId: 'm', role: 'member' as const}
  const guest = {userId: 'g', role: 'guest' as const}

  it('lets an admin change and remove members, not owners', () => {
    expect(memberActions(admin, member, 1)).toEqual({changeRole: true, remove: true, leave: false})
    expect(memberActions(admin, owner, 1)).toEqual({changeRole: false, remove: false, leave: false})
  })

  it('gives members and guests no controls over others', () => {
    expect(memberActions(member, guest, 1)).toEqual({changeRole: false, remove: false, leave: false})
    expect(memberActions(guest, member, 1)).toEqual({changeRole: false, remove: false, leave: false})
  })

  it('lets anyone leave, except the last owner', () => {
    expect(memberActions(member, member, 1).leave).toBe(true)
    expect(memberActions(owner, owner, 1).leave).toBe(false)
    expect(memberActions(owner, owner, 2).leave).toBe(true)
  })
})

describe('claims', () => {
  it('refuses sample shops from /nearby', () => {
    expect(isClaimablePlaceId('sample-car-1')).toBe(false)
    expect(isClaimablePlaceId('ChIJN1t_tDeuEmsRUsoyG83frY4')).toBe(true)
    expect(isClaimablePlaceId(null)).toBe(false)
  })

  it('checks DTI numbers like the database does', () => {
    expect(isDtiBnNumber('3456789')).toBe(true)
    expect(isDtiBnNumber(' 3456789 ')).toBe(true)
    expect(isDtiBnNumber('BN-123')).toBe(false)
    expect(isDtiBnNumber('1234')).toBe(false)
  })

  it('lists every item kind as a category', () => {
    expect([...SHOP_CATEGORIES]).toEqual([...ITEM_KINDS])
  })
})

describe('error codes', () => {
  it('turns SQL error codes into plain words', () => {
    expect(businessError({message: 'last_owner'})).toMatch(/at least one owner/)
    expect(businessError(new Error('invite_wrong_email'))).toMatch(/email the invite/)
  })

  it('keeps unknown messages', () => {
    expect(businessError({message: 'Network down'})).toBe('Network down')
  })
})
