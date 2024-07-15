export default class BroadcastChannel {
  constructor(public name: string) {}
  postMessage(_data: any) {}
  onmessage: (event: MessageEvent) => void = () => {}
  addEventListener(_type: string, _listener: (event: MessageEvent) => void) {}
  removeEventListener(
    _type: string,
    _listener: (event: MessageEvent) => void,
  ) {}
}
