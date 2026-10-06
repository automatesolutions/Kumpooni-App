export type ChatTurn = {
  id: string
  role: 'user' | 'assistant'
  text: string
  hrefs?: {title: string; href: string}[]
  at: string
}

function key(userId: string, fileId: string | null) {
  return `kp-ask:${userId}:${fileId ?? 'all'}`
}

export function loadChat(userId: string, fileId: string | null): ChatTurn[] {
  try {
    const raw = localStorage.getItem(key(userId, fileId))
    return raw ? (JSON.parse(raw) as ChatTurn[]) : []
  } catch {
    return []
  }
}

export function saveChat(userId: string, fileId: string | null, turns: ChatTurn[]) {
  localStorage.setItem(key(userId, fileId), JSON.stringify(turns.slice(-40)))
}
