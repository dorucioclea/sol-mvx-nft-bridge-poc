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
import { lockNftTransaction } from "../../../lib/utils";
import axios from "axios";

export const Bridge: React.FC = () => {
  const { address } = useGetAccountInfo();
  const { chainID } = useGetNetworkConfig();
  const { tokenLogin, isLoggedIn: isMvxLoggedIn } = useGetLoginInfo();
  const { pendingTransactions, hasPendingTransactions } = useGetPendingTransactions();
  const storePublicKey = useUserStore((state) => state.publicKey);
  const isSolanaLoggedIn = useUserStore((state) => state.isSolanaLoggedIn);
  const solBalance = useUserStore((state) => state.solanaBalance);

  const [dataNfts, setDataNfts] = useState<Array<DataNft>>([]);
  const [selectedDataNfts, setSelectedDataNfts] = useState<Array<DataNft>>([]);
  const [amountToBridge, setAmountToBridge] = useState<number>(0);
  const [selectedDataNft, setSelectedDataNft] = useState<Record<any, any>>({});

  const [listTxSessionId, setListTxSessionId] = useState<string>("");
  const [listTxStatus, setListTxStatus] = useState<boolean>(false);
  const [listTxHash, setListTxHash] = useState<string>("");
  const trackTransactionStatus = useTrackTransactionStatus({
    transactionId: listTxSessionId,
  });
  const test =
    "ZXJkMTdlZzQzcjN4dmVudWMweWF5YXVocWYwNjZsdW01MnBobnl0dncwdG52eTY3N3VwN2NhZXNlN2d2M2c.YUhSMGNITTZMeTkxZEdsc2N5NXRkV3gwYVhabGNuTjRMbU52YlEuNDFkNjMwY2NlMzBhMmY2MDgzY2M3YmM0ODA2MThkY2M4ZGUwMGUyZDYwOTIzZWRkZWM3YjBhOTgzOTUwNGE3NS43MjAwLmV5SjBhVzFsYzNSaGJYQWlPakUzTURZMU5UTTVPVEI5.d10c2b59981927cc2b43ebdeab6c9ee93c10a4d064c474188821761df1730f6c3d23634d2622afcfeeb5cdb402b4664e2525a591250856dc3ab3531cabb07907";

  async function bridgeSol(): Promise<any> {
    // console.log("Before req");
    try {
      const url = "https://sol-mvx-nft-bridge-poc-production.up.railway.app/process";
      // console.log("Before post");
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
      // console.log("Inside post");
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
    if (address) {
      const tx = await lockNftTransaction(selectedDataNft.collection, selectedDataNft.nonce, selectedDataNft.amount, address, storePublicKey, chainID);
      setListTxSessionId(tx.sessionId);
    }
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
      <div className="flex justify-center items-center gap-10 ">
        <CardComponent
          title="from"
          imgSrc={mvxLogo}
          logo={mvxText}
          alt="MultiversX Logo"
          isLoggedIn={isMvxLoggedIn}
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
          logo={solText}
          alt="Solana Logo"
          isLoggedIn={isSolanaLoggedIn}
          dataNfts={[]}
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
