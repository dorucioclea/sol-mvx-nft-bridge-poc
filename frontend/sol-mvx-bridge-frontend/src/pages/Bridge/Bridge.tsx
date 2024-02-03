import React, { useEffect, useState } from "react";
import { CardComponent } from "../../components/Card/CardComponent";
import mvxLogo from "../../assets/mvxLogo.png";
import solLogo from "../../assets/solLogo.png";
import mvxText from "../../assets/mvxText.png";
import solText from "../../assets/solText.png";
import { useGetAccountInfo, useGetLoginInfo, useGetNetworkConfig, useGetPendingTransactions, useTrackTransactionStatus } from "@multiversx/sdk-dapp/hooks";
import { useUserStore } from "../../store/user";
import { DataNft } from "@itheum/sdk-mx-data-nft/out";
import { Button } from "../../ui/button";
import { ArrowLeftRight } from "lucide-react";
import { NftsContainer } from "../../components/Container/NftsContainer";
import { getProvider, lockNftTransaction } from "../../../lib/utils";
import axios from "axios";
import { toast } from "sonner";
import { Toaster } from "../../ui/sonner";
import { Address } from "@multiversx/sdk-core/out";
import { Connection, PublicKey, Transaction, clusterApiUrl } from "@solana/web3.js";
import { Metaplex, token, walletAdapterIdentity } from "@metaplex-foundation/js";
import { createBurnInstruction } from "@solana/spl-token";
import bs58 from "bs58";

export const Bridge: React.FC = () => {
  const { address } = useGetAccountInfo();
  const { chainID } = useGetNetworkConfig();
  const { tokenLogin, isLoggedIn: isMvxLoggedIn } = useGetLoginInfo();
  const { pendingTransactions, hasPendingTransactions } = useGetPendingTransactions();
  const storePublicKey = useUserStore((state) => state.publicKey);
  const isSolanaLoggedIn = useUserStore((state) => state.isSolanaLoggedIn);
  const solBalance = useUserStore((state) => state.solanaBalance);
  const solDataNfts = useUserStore((state) => state.solanaDataNfts);
  const { updateIsBridgeLoading } = useUserStore((state) => state);

  const [dataNfts, setDataNfts] = useState<Array<DataNft>>([]);
  const [selectedDataNfts, setSelectedDataNfts] = useState<Array<DataNft>>([]);
  const [amountToBridge, setAmountToBridge] = useState<number>(0);
  const [selectedDataNft, setSelectedDataNft] = useState<Record<any, any>>({});
  const [isMvxSelectedForBridge, setIsMvxSelectedForBridge] = useState<boolean>(true);

  const [listTxSessionId, setListTxSessionId] = useState<string>("");
  const [listTxStatus, setListTxStatus] = useState<boolean>(false);
  const [listTxHash, setListTxHash] = useState<string>("");
  const trackTransactionStatus = useTrackTransactionStatus({
    transactionId: listTxSessionId,
  });
  const test =
    "ZXJkMTdlZzQzcjN4dmVudWMweWF5YXVocWYwNjZsdW01MnBobnl0dncwdG52eTY3N3VwN2NhZXNlN2d2M2c.YUhSMGNITTZMeTkxZEdsc2N5NXRkV3gwYVhabGNuTjRMbU52YlEuNDFkNjMwY2NlMzBhMmY2MDgzY2M3YmM0ODA2MThkY2M4ZGUwMGUyZDYwOTIzZWRkZWM3YjBhOTgzOTUwNGE3NS43MjAwLmV5SjBhVzFsYzNSaGJYQWlPakUzTURZMU5UTTVPVEI5.d10c2b59981927cc2b43ebdeab6c9ee93c10a4d064c474188821761df1730f6c3d23634d2622afcfeeb5cdb402b4664e2525a591250856dc3ab3531cabb07907";

  const ironForgeRPC = "https://rpc.ironforge.network/devnet?apiKey=01HNJAHBRF5A8MXB0VYCMSHNCZ";

  const connection = new Connection(clusterApiUrl("devnet"));

  const mx = Metaplex.make(connection);

  async function bridgeSol(): Promise<any> {
    // console.log("Before req");
    try {
      await updateIsBridgeLoading(true);
      const url = "https://sol-mvx-nft-bridge-poc-production.up.railway.app/process";
      // console.log("Before post");
      await toast.info("Processing transaction on Solana", { duration: 7000 });
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
      await updateIsBridgeLoading(false);
      await toast.success("Transaction successful", { duration: 7000 });
      console.log(data);
      return data;
    } catch (error) {
      await toast.error("Transaction failed", { duration: 7000 });
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
    setSelectedDataNfts([]);
    // bridgeSol(tokenLogin?.nativeAuthToken, listTxHash);
    // console.log(pendingTransactions);
  }, [pendingTransactions]);

  useEffect(() => {
    setListTxStatus(trackTransactionStatus.isSuccessful ? true : false);
  }, [trackTransactionStatus]);

  const handleSendTransaction = async () => {
    if (isMvxSelectedForBridge) {
      const tx = await lockNftTransaction(selectedDataNft.collection, selectedDataNft.nonce, selectedDataNft.amount, address, storePublicKey, chainID);
      setListTxSessionId(tx.sessionId);
    } else {
      // bridge back process
      const getMessageToSign = `https://sol-mvx-nft-bridge-poc-production.up.railway.app/getNonceToSign/${storePublicKey}`;

      const { data } = await axios.get(getMessageToSign);

      const { signature } = await window.solana.signMessage(new TextEncoder().encode(data.messageToSign), "utf8");

      const signatureEncoded = bs58.encode(signature);

      const provider = getProvider();

      let tx = new Transaction().add(
        createBurnInstruction(
          new PublicKey(storePublicKey),
          new PublicKey(selectedDataNft.newData.mint.address.toString()), // mint
          new PublicKey(selectedDataNft.newData.address.toString()), // owner of token account
          selectedDataNft.amount
        )
      );
      let blockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
      tx.recentBlockhash = blockhash;
      tx.feePayer = new PublicKey(storePublicKey);
      const signedTx = await provider.signTransaction(tx);

      const post = {
        signature: signatureEncoded,
        sftAddress: selectedDataNft.newData.mint.address.toString(),
        amount: selectedDataNft.amount,
        accessRequesterAddr: storePublicKey,
        mvxAddress: address,
      };

      const url = "https://sol-mvx-nft-bridge-poc-production.up.railway.app/process_back";

      const res = await axios.post(url, post);

      const processBackTxHash = res.data.Mvx.txHash;

      await connection.sendRawTransaction(signedTx.serialize());

      const statusQuery = `https://devnet-api.multiversx.com/transactions/${processBackTxHash}?fields=status
    `;

      const statusRes = await axios.get(statusQuery);

      const status = statusRes.data.status;
    }
    setSelectedDataNfts([]);
  };

  useEffect(() => {
    async function fetchData() {
      const _dataNfts = await DataNft.ownedByAddress(address);
      // console.log(_dataNfts);
      setDataNfts(_dataNfts);
    }
    if (!hasPendingTransactions) {
      fetchData();
    }
  }, [hasPendingTransactions]);

  useEffect(() => {
    (async () => {
      if (listTxStatus) {
        await bridgeSol();
      }
    })();
  }, [listTxStatus]);

  // console.log(address);
  // console.log(selectedDataNft);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-lg">Please select the blockchain that you want to bridge from</span>
        <div className="flex gap-3">
          <Button variant={isMvxSelectedForBridge ? "default" : "outline"} className="border-primary" size="sm" onClick={() => setIsMvxSelectedForBridge(true)}>
            MultiversX
          </Button>
          <Button
            variant={isMvxSelectedForBridge ? "outline" : "default"}
            className="border-primary"
            size="sm"
            onClick={() => setIsMvxSelectedForBridge(false)}>
            Solana
          </Button>
        </div>
      </div>
      <div className="flex justify-center items-center gap-10 ">
        <CardComponent
          title="from"
          imgSrc={isMvxSelectedForBridge ? mvxLogo : solLogo}
          logo={isMvxSelectedForBridge ? mvxText : solText}
          alt={isMvxSelectedForBridge ? "MultiversX Logo" : "Solana Logo"}
          isLoggedIn={isMvxSelectedForBridge ? isMvxLoggedIn : isSolanaLoggedIn}
          dataNfts={isMvxSelectedForBridge ? dataNfts : solDataNfts}
          isSolDataNfts={!isMvxSelectedForBridge}
          selectedDataNfts={selectedDataNfts}
          setSelectedDataNfts={setSelectedDataNfts}
        />
        <Button onClick={handleSendTransaction}>
          <ArrowLeftRight className="w-4 h-4 mr-1" /> Bridge
        </Button>
        <CardComponent
          title="to"
          imgSrc={isMvxSelectedForBridge ? solLogo : mvxLogo}
          logo={isMvxSelectedForBridge ? solText : mvxText}
          alt={isMvxSelectedForBridge ? "Solana Logo" : "MultiversX Logo"}
          isLoggedIn={isMvxSelectedForBridge ? isSolanaLoggedIn : isMvxLoggedIn}
          dataNfts={isMvxSelectedForBridge ? solDataNfts : dataNfts}
          isSolDataNfts={isMvxSelectedForBridge}
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
        isMvxDataNfts={isMvxSelectedForBridge}
      />
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
};
