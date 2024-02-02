import React, { useEffect, useState } from "react";
import { CardComponent } from "../../components/Card/CardComponent";
import mvxLogo from "../../assets/mvxLogo.png";
import solLogo from "../../assets/solLogo.png";
import { useGetAccountInfo, useGetLoginInfo, useGetNetworkConfig, useGetPendingTransactions, useTrackTransactionStatus } from "@multiversx/sdk-dapp/hooks";
import { useUserStore } from "../../store/user";
import { DataNft } from "@itheum/sdk-mx-data-nft/out";
import { Button } from "../../ui/button";
import { ArrowLeftRight } from "lucide-react";
import { NftsContainer } from "../../components/Container/NftsContainer";
import { getProvider, lockNftTransaction } from "../../../lib/utils";
import axios from "axios";
import { Address } from "@multiversx/sdk-core/out";
import { Connection, PublicKey, Transaction, clusterApiUrl } from "@solana/web3.js";
import { Metaplex, token, walletAdapterIdentity } from "@metaplex-foundation/js";
import { SolDataNft } from "../Solana/SolNfts/SolDataNft";
import { createBurnInstruction } from "@solana/spl-token";

export const Bridge: React.FC = () => {
  const { address } = useGetAccountInfo();
  const { publicKey } = useUserStore((state) => state);
  const { chainID } = useGetNetworkConfig();
  const { tokenLogin } = useGetLoginInfo();
  const { pendingTransactions, hasPendingTransactions } = useGetPendingTransactions();
  const storePublicKey = useUserStore((state) => state.publicKey);
  const solBalance = useUserStore((state) => state.solanaBalance);

  const [dataNfts, setDataNfts] = useState<Array<DataNft>>([]);
  const [solDataNfts, setSolDataNfts] = useState<Array<SolDataNft>>([]);
  const [selectedDataNfts, setSelectedDataNfts] = useState<Array<DataNft>>([]);
  const [amountToBridge, setAmountToBridge] = useState<number>(0);
  const [selectedDataNft, setSelectedDataNft] = useState<Record<any, any>>({});

  const [bridgeIsActive, setBridgeIsActive] = useState<boolean>(false);

  const [listTxSessionId, setListTxSessionId] = useState<string>("");
  const [listTxStatus, setListTxStatus] = useState<boolean>(false);
  const [listTxHash, setListTxHash] = useState<string>("");
  const trackTransactionStatus = useTrackTransactionStatus({
    transactionId: listTxSessionId,
  });

  const ironForgeRPC = "https://rpc.ironforge.network/devnet?apiKey=01HNJAHBRF5A8MXB0VYCMSHNCZ";

  const connection = new Connection(clusterApiUrl("devnet"));

  const mx = Metaplex.make(connection);

  async function bridgeSol(): Promise<any> {
    console.log("Before req");
    try {
      const url = "https://sol-mvx-nft-bridge-poc-production.up.railway.app/process";
      console.log("Before post");
      const { data } = await axios.post(
        url,
        {
          txHash: listTxHash,
        },
        {
          headers: {
            Authorization: `Bearer ${tokenLogin?.nativeAuthToken}`,
          },
        }
      );
      console.log("Inside post");
      setBridgeIsActive(false);
      return data;
    } catch (error) {
      console.error(error);
      return {};
    }
  }

  // console.log(listTxHash);
  useEffect(() => {
    console.log(address);
    if (!pendingTransactions[listTxSessionId]) return;
    const transactionHash = pendingTransactions[listTxSessionId].transactions[0].hash;
    setListTxHash(transactionHash);
    // bridgeSol(tokenLogin?.nativeAuthToken, listTxHash);
    // console.log(pendingTransactions);
  }, [pendingTransactions]);

  useEffect(() => {
    setListTxStatus(trackTransactionStatus.isSuccessful ? true : false);
  }, [trackTransactionStatus]);

  const handleSendTransaction = async () => {
    // handle bridge between chains
    // if (address) {
    //   const tx = await lockNftTransaction(selectedDataNft.collection, selectedDataNft.nonce, selectedDataNft.amount, address, storePublicKey, chainID);
    //   setListTxSessionId(tx.sessionId);
    // }

    const getMessageToSign = `https://sol-mvx-nft-bridge-poc-production.up.railway.app/getNonceToSign/${publicKey}`;

    const { data } = await axios.get(getMessageToSign);

    const { signature } = await window.solana.signMessage(new TextEncoder().encode(data.messageToSign), "utf8");

    const provider = getProvider();

    let tx = new Transaction().add(
      createBurnInstruction(
        new PublicKey(selectedDataNft.tokenAccount),
        new PublicKey(selectedDataNft.mintAddress), // mint
        new PublicKey(publicKey), // owner of token account
        selectedDataNft.amount
      )
    );
    let blockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
    tx.recentBlockhash = blockhash;
    tx.feePayer = new PublicKey(publicKey);
    const signedTx = await provider.signTransaction(tx);

    const post = {
      signature,
      sftAddress: selectedDataNft.mintAddress,
      amount: selectedDataNft.amount,
      accessRequesterAddr: publicKey,
      mvxAddress: address,
    };

    const url = "https://sol-mvx-nft-bridge-poc-production.up.railway.app/process_back";

    const res = await axios.post(url, post);
    console.log(res.data);

    await connection.sendRawTransaction(signedTx.serialize());
  };

  useEffect(() => {
    async function fetchData() {
      const _dataNfts = await DataNft.ownedByAddress(address);
      // console.log(_dataNfts);

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
      const mintIds = data.result.value
        .map((item: any) => {
          if (item.account.data.parsed.info.tokenAmount.uiAmount > 0) {
            return {
              mintAddress: item.account.data.parsed.info.mint,
              solBalance: item.account.data.parsed.info.tokenAmount.uiAmount,
              tokenAccount: item.pubkey,
            };
          }
        })
        .filter((mintId: string | undefined) => mintId !== undefined);
      const _solDataNfts: SolDataNft[] = [];

      for (const mintId of mintIds) {
        console.log(mintId);
        const newData: any = await mx.nfts().findByMint({ mintAddress: new PublicKey(mintId.mintAddress) });
        console.log(newData);
        const { data } = await axios.get(newData.uri);

        const tokenIdentifierAttribute = data.attributes.find((attribute: any) => attribute.trait_type === "Token Identifier");
        const tokenNonceAttribute = data.attributes.find((attribute: any) => attribute.trait_type === "Token Nonce");

        if (tokenIdentifierAttribute && tokenNonceAttribute) {
          const tokenIdentifier = tokenIdentifierAttribute.value;
          const nonce = tokenNonceAttribute.value;

          const dataNft: DataNft = await DataNft.createFromApi({ nonce, tokenIdentifier });
          _solDataNfts.push(new SolDataNft(dataNft, newData.mint.address.toString(), data, mintId.solBalance, mintId.tokenAccount));
        }
      }

      console.log(_solDataNfts);
      setSolDataNfts(_solDataNfts);
      setDataNfts(_dataNfts);
    }
    if (!hasPendingTransactions || !bridgeIsActive) {
      fetchData();
    }
  }, [hasPendingTransactions, bridgeIsActive]);

  useEffect(() => {
    (async () => {
      if (listTxStatus) {
        setBridgeIsActive(true);
        await bridgeSol();
      }
    })();
  }, [listTxStatus]);

  console.log(address);
  // console.log(selectedDataNft);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center items-center gap-10 ">
        <CardComponent
          title="from"
          imgSrc={mvxLogo}
          alt="MultiversX Logo"
          dataNfts={dataNfts}
          selectedDataNfts={selectedDataNfts}
          setSelectedDataNfts={setSelectedDataNfts}
        />
        <Button onClick={handleSendTransaction}>
          <ArrowLeftRight className="w-4 h-4 mr-1" /> Bridge
        </Button>
        <CardComponent
          title="to"
          imgSrc={solLogo}
          alt="Solana Logo"
          dataNfts={solDataNfts}
          selectedDataNfts={selectedDataNfts}
          setSelectedDataNfts={setSelectedDataNfts}
        />
      </div>
      <NftsContainer
        amountToBridge={amountToBridge}
        selectedNfts={selectedDataNfts}
        selectedNft={selectedDataNft}
        setSelectedNft={setSelectedDataNft}
        setAmountToBridge={setAmountToBridge}
      />
    </div>
  );
};
