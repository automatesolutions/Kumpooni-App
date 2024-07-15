import TLDs from 'tlds'

const AUTOMATE_TRUSTED_HOSTS = [
  'automate.app',
  'automate.zendesk.com',
  ...(__DEV__ ? ['localhost:19006', 'localhost:8100'] : []),
]

/*
 * This will allow any AUTOMATE_TRUSTED_HOSTS value by itself or with a subdomain.
 * It will also allow relative paths like /profile as well as #.
 */
const TRUSTED_REGEX = new RegExp(
  `^(http(s)?://(([\\w-]+\\.)?${AUTOMATE_TRUSTED_HOSTS.join(
    '|([\\w-]+\\.)?',
  )})|/|#)`,
)

export function isAutomateAppUrl(url: string): boolean {
  return url.startsWith('https://automate-solutions.com/')
}
export function convertAutomateAppUrlIfNeeded(url: string): string {
  if (isAutomateAppUrl(url)) {
    try {
      const urlp = new URL(url)
      return urlp.pathname
    } catch (e) {
      console.error('Unexpected error in convertBskyAppUrlIfNeeded()', e)
    }
  }
  return url
}

export function isRelativeUrl(url: string): boolean {
  return /^\/[^/]/.test(url)
}

export function isAutomateSSUrl(url: string): boolean {
  return (
    (url.startsWith('https://automate-solutions.com/') || isRelativeUrl(url)) &&
    /\/rss\/?$/.test(url)
  )
}

export function isExternalUrl(url: string): boolean {
  const external = !isAutomateAppUrl(url) && url.startsWith('http')
  const rss = isAutomateSSUrl(url)
  return external || rss
}

export function isTrustedUrl(url: string): boolean {
  return TRUSTED_REGEX.test(url)
}

export function isValidDomain(str: string): boolean {
  return !!TLDs.find(tld => {
    let i = str.lastIndexOf(tld)
    if (i === -1) {
      return false
    }
    return str.charAt(i - 1) === '.' && i === str.length - tld.length
  })
}

export function linkRequiresWarning(uri: string, label: string) {
  const labelDomain = labelToDomain(label)

  // We should trust any relative URL or a # since we know it links to internal content
  if (isRelativeUrl(uri) || uri === '#') {
    return false
  }

  let urip
  try {
    urip = new URL(uri)
  } catch {
    return true
  }

  const host = urip.hostname.toLowerCase()
  if (isTrustedUrl(uri)) {
    // if this is a link to internal content, warn if it represents itself as a URL to another app
    return !!labelDomain && labelDomain !== host && isPossiblyAUrl(labelDomain)
  } else {
    // if this is a link to external content, warn if the label doesnt match the target
    if (!labelDomain) {
      return true
    }
    return labelDomain !== host
  }
}

/**
 * Returns a lowercase domain hostname if the label is a valid URL.
 *
 * Hosts are case-insensitive, so should be lowercase for comparison.
 * @see https://www.rfc-editor.org/rfc/rfc3986#section-3.2.2
 */
export function labelToDomain(label: string): string | undefined {
  // any spaces just immediately consider the label a non-url
  if (/\s/.test(label)) {
    return undefined
  }
  try {
    return new URL(label).hostname.toLowerCase()
  } catch {}
  try {
    return new URL('https://' + label).hostname.toLowerCase()
  } catch {}
  return undefined
}

export function isPossiblyAUrl(str: string): boolean {
  str = str.trim()
  if (str.startsWith('http://')) {
    return true
  }
  if (str.startsWith('https://')) {
    return true
  }
  const [firstWord] = str.split(/[\s\/]/)
  return isValidDomain(firstWord)
}
