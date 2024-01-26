import React, { useEffect, useState } from "react";
import { CardComponent } from "../../components/Card/CardComponent";
import mvxLogo from "../../assets/mvxLogo.png";
import solLogo from "../../assets/solLogo.png";
import { useGetAccountInfo, useGetPendingTransactions } from "@multiversx/sdk-dapp/hooks";
import { useUserStore } from "../../store/user";
import { DataNft } from "@itheum/sdk-mx-data-nft/out";
import { Button } from "../../ui/button";
import { ArrowLeftRight } from "lucide-react";
import { NftsContainer } from "../../components/Container/NftsContainer";
export const Bridge: React.FC = () => {
  const { address } = useGetAccountInfo();
  const { hasPendingTransactions } = useGetPendingTransactions();
  const storePublicKey = useUserStore((state) => state.publicKey);
  const solBalance = useUserStore((state) => state.solanaBalance);

  const [dataNfts, setDataNfts] = useState<Array<DataNft>>([]);
  const [selectedDataNfts, setSelectedDataNfts] = useState<Array<DataNft>>([]);

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

  // console.log(address, storePublicKey, solBalance);

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
        <Button>
          <ArrowLeftRight className="w-4 h-4 mr-1" /> Bridge
        </Button>
        <CardComponent
          title="to"
          imgSrc={solLogo}
          alt="Solana Logo"
          dataNfts={[]}
          selectedDataNfts={selectedDataNfts}
          setSelectedDataNfts={setSelectedDataNfts}
        />
      </div>
      <NftsContainer selectedNft={selectedDataNfts} />
    </div>
  );
};
