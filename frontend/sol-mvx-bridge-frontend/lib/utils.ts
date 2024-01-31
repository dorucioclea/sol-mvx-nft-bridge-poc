import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Connection, PublicKey } from "@solana/web3.js";
import { useUserStore } from "../src/store/user";
import {
  Address,
  AddressValue,
  BigUIntValue,
  ContractCallPayloadBuilder,
  ContractFunction,
  StringValue,
  TokenIdentifierValue,
  Transaction,
  U64Value,
} from "@multiversx/sdk-core/out";
import { refreshAccount } from "@multiversx/sdk-dapp/utils";
import { sendTransactions } from "@multiversx/sdk-dapp/services";

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

// export const getWalletBalance = async (pubKey: PublicKey) => {
//   const connection = new Connection("https://api.devnet.solana.com");
//   const updaSolanaBalance = useUserStore((state) => state.updateSolanaBalance);
//
//   if (typeof pubKey === "undefined" || pubKey === null) return;
//   let balance = await connection.getBalance(pubKey);
//   updaSolanaBalance(Number(balance));
//   return balance;
// };

export const clearMvxSessionStorage = () => {
  localStorage.removeItem("persist:sdk-dapp-store");
};
export const clearSolSessionStorage = () => {
  localStorage.setItem("solanaPublicKey", "");
};

export async function lockNftTransaction(
  tokenIdentifier: string,
  nonce: number,
  amount: number,
  senderAddress: string,
  solanaPubKey: string,
  chainID: string,
  callbackRoute?: string
) {
  const lockSFTtx = new Transaction({
    value: 0,
    data: new ContractCallPayloadBuilder()
      .setFunction(new ContractFunction("ESDTNFTTransfer"))
      .addArg(new TokenIdentifierValue(tokenIdentifier))
      .addArg(new U64Value(nonce))
      .addArg(new BigUIntValue(amount))
      .addArg(new AddressValue(new Address("erd1qqqqqqqqqqqqqpgqqhr8zr3h02nlk5lse3jus7dpwez9w4lyw3wq0c0jl0")))
      .addArg(new StringValue("lock"))
      .addArg(new StringValue(solanaPubKey))
      .build(),
    receiver: new Address(senderAddress),
    sender: new Address(senderAddress),
    gasLimit: 20000000,
    chainID: chainID,
  });

  await refreshAccount();

  const { sessionId, error } = await sendTransactions({
    transactions: lockSFTtx,
    transactionsDisplayInfo: {
      processingMessage: "Locking NFT",
      errorMessage: "Error occurred during locking",
      successMessage: "Lock successfull",
    },
    redirectAfterSign: callbackRoute ? true : false,
    callbackRoute: callbackRoute ?? window.location.pathname,
  });
  // console.log(sessionId, error);
  return { sessionId, error }; // use this sessionId to get txHash
}
