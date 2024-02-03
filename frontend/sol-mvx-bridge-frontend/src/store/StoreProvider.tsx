import React, { useEffect } from "react";
import { useUserStore } from "./user";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { Metaplex } from "@metaplex-foundation/js";
import axios from "axios";
import { sleep } from "../../lib/utils";

type StoreProviderProps = {
  children: React.ReactNode;
};

export const StoreProvider: React.FC<StoreProviderProps> = (props) => {
  const { children } = props;

  const { updatePublicKey, updateIsSolanaLoggedIn, updateSolanaBalance, updateSolanaDataNfts, isSolanaLoggedIn, publicKey, isBridgeLoading } = useUserStore(
    (state) => state
  );

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
      await getAllTokenForAddress();
    })();
  }, [isSolanaLoggedIn]);

  useEffect(() => {
    (async () => {
      await sleep(2000);
      await getAllTokenForAddress();
    })();
  }, [isBridgeLoading]);

  const ironForgeRPC = "https://rpc.ironforge.network/devnet?apiKey=01HNJAHBRF5A8MXB0VYCMSHNCZ";

  const getAllTokenForAddress = async () => {
    // WORKING
    const connection = new Connection(clusterApiUrl("devnet"));
    const mx = Metaplex.make(connection);
    // try {
    //   const data = await mx.nfts().findAllByOwner({ owner: new PublicKey(publicKey) });
    //   console.log(data);
    //   setDataNfts(data);
    // } catch (error) {
    //   console.error(error);
    // }
    // -------------------------
    // try {
    //   const { data } = await axios.get(`${solanafmBaseUrl}/v1/addresses/${walletAddress}/tokens`, {
    //     params: {
    //       accountHash: true,
    //       tokenType: "Fungible",
    //       network: "devnet",
    //     },
    //     headers: {
    //       ApiKey: apikey,
    //       "Content-Type": "application/json",
    //     },
    //   });
    //   console.log(data);
    //   // const url = "https://api.solana.fm/v1/addresses/7MSGH3PVGYae7mEn2AXTt1nfsTyoHQxTG7L91cPFEDWn/tokens?network=devnet";
    // } catch (error: any) {
    //   console.error(error.message);
    // }
    // --------------------------
    const postData = {
      jsonrpc: "2.0",
      id: 1,
      method: "getTokenAccountsByOwner",
      params: [
        publicKey,
        {
          "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
        {
          "encoding": "jsonParsed",
        },
      ],
    };
    //
    const { data } = await axios.post(ironForgeRPC, postData);
    console.log(data);
    const mintIds = data.result.value.map((item: any) => item.account.data.parsed.info.mint);
    const _dataNft: any = [];

    for (const mintId of mintIds) {
      const newData: any = await mx.nfts().findByMint({ mintAddress: new PublicKey(mintId) });
      const { data } = await axios.get(newData.uri);
      if (newData.model === "sft") {
        _dataNft.push({ newData, dataNftsMetadata: data });
      }
      // console.log(newData.metadataAddress.toString());
    }
    console.log(
      _dataNft,
      _dataNft.map((item: any) => item.newData.mint.supply.basisPoints.toString())
    );
    updateSolanaDataNfts(_dataNft);
    //
    // setDataNfts(mintId);
  };

  return <>{children}</>;
};
