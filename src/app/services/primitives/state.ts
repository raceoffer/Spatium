export enum State {
  Stopped = 0x0000000a,
  Starting = 0x0000000b,
  Started = 0x0000000c,
  Stopping = 0x0000000d
}

export enum ConnectionState {
  None,
  Connecting,
  Connected
}
