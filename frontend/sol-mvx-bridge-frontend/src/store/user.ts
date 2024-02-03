import { create } from "zustand";

type State = {
  isSolanaLoggedIn: boolean;
  publicKey: string;
  solanaBalance: number;
  solanaDataNfts: Array<any>;
  isBridgeLoading: boolean;
};

type Action = {
  updateIsSolanaLoggedIn: (isSolanaLoggedIn: State["isSolanaLoggedIn"]) => void;
  updatePublicKey: (publicKey: State["publicKey"]) => void;
  updateSolanaBalance: (solanaBalance: State["solanaBalance"]) => void;
  updateSolanaDataNfts: (solanaDataNfts: State["solanaDataNfts"]) => void;
  updateIsBridgeLoading: (isBridgeLoading: State["isBridgeLoading"]) => void;
};

export const useUserStore = create<State & Action>((set) => ({
  isSolanaLoggedIn: false,
  updateIsSolanaLoggedIn: (value: boolean) => set(() => ({ isSolanaLoggedIn: value })),
  publicKey: "",
  updatePublicKey: (value: string) => set(() => ({ publicKey: value })),
  solanaBalance: 0,
  updateSolanaBalance: (value: number) => set(() => ({ solanaBalance: value })),
  solanaDataNfts: [],
  updateSolanaDataNfts: (value: Array<any>) => set(() => ({ solanaDataNfts: value })),
  isBridgeLoading: false,
  updateIsBridgeLoading: (value: boolean) => set(() => ({ isBridgeLoading: value })),
}));
