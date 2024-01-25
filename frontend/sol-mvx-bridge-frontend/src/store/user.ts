import { create } from "zustand";
import { SolAmount } from "@metaplex-foundation/umi";
import { PublicKey } from "@solana/web3.js";

type State = {
  isSolanaLoggedIn: boolean;
  publicKey: string | null;
  solanaBalance: number;
};

type Action = {
  updateIsSolanaLoggedIn: (isSolanaLoggedIn: State["isSolanaLoggedIn"]) => void;
  updatePublicKey: (publicKey: State["publicKey"]) => void;
  updateSolanaBalance: (solanaBalance: State["solanaBalance"]) => void;
};

export const useUserStore = create<State & Action>((set) => ({
  isSolanaLoggedIn: false,
  updateIsSolanaLoggedIn: (value: boolean) => set(() => ({ isSolanaLoggedIn: value })),
  publicKey: null,
  updatePublicKey: (value: string | null) => set(() => ({ publicKey: value })),
  solanaBalance: 0,
  updateSolanaBalance: (value: number) => set(() => ({ solanaBalance: value })),
}));
