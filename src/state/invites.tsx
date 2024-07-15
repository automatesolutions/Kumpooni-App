import React from 'react'
import * as persisted from './persisted'

type StateContext = persisted.Schema['invites']

type ApiContext = {
  setInviteCopied: (code: string) => void
}

const stateContext = React.createContext<StateContext>(
  persisted.defaults.invites,
)
const apiContext = React.createContext<ApiContext>({
  setInviteCopied(_: string) {},
})

export function Provider({ children }: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('invites'))

  const api = React.useMemo(
    () => ({
      setInviteCopied(code: string) {
        setState(state => {
          state = {
            ...state,
            copiedInvites: state.copiedInvites.includes(code)
              ? state.copiedInvites
              : state.copiedInvites.concat([code]),
          }
          persisted.write('invites', state)
          return state
        })
      },
    }),
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate(() => {
      console.log('onUpdateInvites called')
      setState(persisted.get('invites'))
    })
  }, [setState])

  return (
    <stateContext.Provider value={state}>
      <apiContext.Provider value={api}>{children}</apiContext.Provider>
    </stateContext.Provider>
  )
}

export function useInvitesState() {
  const context = React.useContext(stateContext)

  if (context == undefined) {
    throw new Error('useInvitesState must be used within a InvitesProvider')
  }
  // return React.useContext(stateContext)
  return context
}

export function useInvitesAPI() {
  return React.useContext(apiContext)
}
