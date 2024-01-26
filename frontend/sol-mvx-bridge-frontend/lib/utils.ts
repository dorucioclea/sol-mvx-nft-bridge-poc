import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Connection, PublicKey } from "@solana/web3.js";

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

const connection = new Connection("https://api.devnet.solana.com");
export const getWalletBalance = async (pubKey1: PublicKey) => {
  if (typeof pubKey1 === "undefined" || pubKey1 === null) return;
  let balance = await connection.getBalance(pubKey1);
  return balance;
};

export const clearMvxSessionStorage = () => {
  localStorage.removeItem("persist:sdk-dapp-store");
};
