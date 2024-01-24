export interface LockEvent {
  caller: string;
  tokenIdentifier: string;
  nonce: number;
  amount: number;
}
