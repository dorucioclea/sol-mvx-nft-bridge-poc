import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Connection, PublicKey } from "@solana/web3.js";
import { useUserStore } from "../src/store/user";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getProvider = () => {
  if ("solana" in window) {
    const provider = window.solana;
    if (provider?.isPhantom) {
      return provider;
    }
  }

  window.open("https://phantom.app/", "_blank");
};

export const getWalletBalance = async (pubKey: PublicKey) => {
  const connection = new Connection("https://api.devnet.solana.com");
  const updaSolanaBalance = useUserStore((state) => state.updateSolanaBalance);

  if (typeof pubKey === "undefined" || pubKey === null) return;
  let balance = await connection.getBalance(pubKey);
  updaSolanaBalance(Number(balance));
  return balance;
};

export const clearMvxSessionStorage = () => {
  localStorage.removeItem("persist:sdk-dapp-store");
};
