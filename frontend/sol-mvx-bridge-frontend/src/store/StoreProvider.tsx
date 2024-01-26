import React, { useEffect } from "react";
import { useUserStore } from "./user";
import { getProvider, getWalletBalance } from "../../lib/utils";
import { PublicKey } from "@solana/web3.js";

type StoreProviderProps = {
  children: React.ReactNode;
};

export const StoreProvider: React.FC<StoreProviderProps> = (props) => {
  const { children } = props;
  // const provider = getProvider();
  const updatePublicKey = useUserStore((state) => state.updatePublicKey);
  const updateIsSolanaLoggedIn = useUserStore((state) => state.updateIsSolanaLoggedIn);

  const solanaPublicKey = localStorage.getItem("solanaPublicKey");

  getWalletBalance(new PublicKey(solanaPublicKey ?? ""));

  useEffect(() => {
    if (solanaPublicKey !== null) {
      updatePublicKey(solanaPublicKey);
      updateIsSolanaLoggedIn(true);
    } else {
      updatePublicKey("");
      updateIsSolanaLoggedIn(false);
    }
  }, []);

  return <>{children}</>;
};
