import React from 'react'
import * as persisted from './persisted'

type CurrentCar = persisted.PersistedCurrentCar

type CurrentCarState = {
  currentCar: CurrentCar | undefined
}

type StateContext = CurrentCarState & {
  hasCurrentCar: boolean
}

type ApiContext = {
  setCurrentCar: (_: CurrentCar) => void
}

const StateContext = React.createContext<StateContext>({
  currentCar: undefined,
  hasCurrentCar: false,
})
const ApiContext = React.createContext<ApiContext>({
  setCurrentCar(props: CurrentCar) {},
})

export function Provider({ children }: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState<CurrentCarState>({
    currentCar: persisted.get('currentCar'),
  })

  const stateContext = React.useMemo(
    () => ({
      ...state,
      hasCurrentCar: !!state.currentCar,
    }),
    [state],
  )
  const api = React.useMemo(
    () => ({
      setCurrentCar(car: CurrentCar) {
        setState(state => {
          state = {
            ...state,
            ...car,
          }
          persisted.write('currentCar', state.currentCar)
          return state
        })
      },
    }),
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate(() => {
      console.log('onUpdateCurrentCar called')
      setState(s => ({
        ...s,
        currentCar: persisted.get('currentCar'),
      }))
    })
  }, [setState])

  return (
    <StateContext.Provider value={stateContext}>
      <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
    </StateContext.Provider>
  )
}

export function useCurrentCar() {
  return React.useContext(StateContext)
}

export function useCurrentCarApi() {
  return React.useContext(ApiContext)
}
