// import React, { PropsWithChildren, useEffect } from "react";
// import { useUserStore } from "./user";
// import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
// import { amountToString, publicKey, sol } from "@metaplex-foundation/umi";
//
// type StoreProviderProps = {
//   children: React.ReactNode;
// };
// export const StoreProvider: React.FC<StoreProviderProps> = (props) => {
//   const { children } = props;
//   const storePublicKey = useUserStore((state) => state.publicKey);
//   const isSolanaLoggedIn = useUserStore((state) => state.isSolanaLoggedIn);
//   // const updaSolanaBalance = useUserStore((state) => state.updateSolanaBalance);
//   //
//   //
//   // useEffect(() => {
//   //   (async () => {
//   //     if (storePublicKey !== null) {
//   //       const balance = await umi.rpc.getBalance(publicKey(storePublicKey));
//   //       updaSolanaBalance(amountToString(sol(Number(balance))));
//   //     }
//   //   })();
//   // }, [isSolanaLoggedIn]);
//
//   return <>{children}</>;
// };
