import React, { useEffect } from "react";
import { useUserStore } from "./user";
import { Connection, PublicKey } from "@solana/web3.js";

type StoreProviderProps = {
  children: React.ReactNode;
};

export const StoreProvider: React.FC<StoreProviderProps> = (props) => {
  const { children } = props;

  const { updatePublicKey, updateIsSolanaLoggedIn, updateSolanaBalance, isSolanaLoggedIn } = useUserStore((state) => state);

  const solanaPublicKey = localStorage.getItem("solanaPublicKey");

  useEffect(() => {
    if (solanaPublicKey !== null && solanaPublicKey !== "") {
      updatePublicKey(solanaPublicKey);
      updateIsSolanaLoggedIn(true);
    } else {
      updatePublicKey("");
      updateIsSolanaLoggedIn(false);
    }

    (async () => {
      const connection = new Connection("https://api.devnet.solana.com");

      if (typeof solanaPublicKey === undefined || solanaPublicKey === null || solanaPublicKey === "") return;
      const balance = await connection.getBalance(new PublicKey(solanaPublicKey));
      updateSolanaBalance(Number(balance));
    })();
  }, [isSolanaLoggedIn]);

  return <>{children}</>;
};
