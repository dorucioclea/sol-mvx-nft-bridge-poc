import React, { useEffect } from "react";
import { Card, CardContent } from "../../ui/card";
import { DataNft } from "@itheum/sdk-mx-data-nft/out";
import { Input } from "../../ui/input";

type NftsContainerProps = {
  isMvxDataNfts: boolean;
  selectedNfts: Array<any>;
  amountToBridge: number;
  setAmountToBridge: React.Dispatch<React.SetStateAction<number>>;
  selectedNft: Record<any, any>;
  setSelectedNft: React.Dispatch<React.SetStateAction<Record<any, any>>>;
};

export const NftsContainer: React.FC<NftsContainerProps> = (props) => {
  const { isMvxDataNfts, selectedNfts, amountToBridge, setAmountToBridge, selectedNft, setSelectedNft } = props;
  // console.log(selectedNft);

  useEffect(() => {
    if (selectedNfts.length === 1) {
      setSelectedNft({ ...selectedNfts[0], amount: amountToBridge });
    }
  }, [amountToBridge]);
  console.log(selectedNft);

  return (
    <Card className="bg-transparent">
      <div className="flex flex-col items-center justify-center border-b">
        <span className="py-2 text-2xl">Select NFTs to bridge</span>
      </div>
      <CardContent className="h-[19.5rem] w-[63rem] flex flex-wrap overflow-y-scroll my-2 mx-1 p-0">
        <div className="flex flex-wrap w-full gap-2 px-1">
          {selectedNfts?.length === 0 ? (
            <div className="flex justify-center items-center h-[19.5rem] w-full">
              <h1 className="text-2xl text-muted-foreground">No NFTs selected</h1>
            </div>
          ) : (
            selectedNfts?.map((nft, index) => (
              <div key={index} className="w-[15rem] h-[16rem] py-2 border rounded-xl px-3 line-clamp-1">
                {isMvxDataNfts ? (
                  <>
                    <img src={nft.nftImgUrl} alt={nft.tokenIdentifier} className="w-[6rem] mx-auto" />
                    <span className="text-sm line-clamp-2 h-[3.5rem] pt-2">{nft.title}</span>
                    <span className="text-xs text-muted-foreground line-clamp-2 h-[2.4rem]">Available supply: {Number(nft.balance)}</span>
                    <Input
                      type="number"
                      placeholder="Amount to send"
                      className="w-[10rem]"
                      onChange={(e) => setAmountToBridge(Number(e.target.value))}
                      max={Number(nft.balance)}
                    />
                  </>
                ) : (
                  <>
                    <img src={nft.dataNftsMetadata.image} alt={nft.dataNftsMetadata.image} className="w-[6rem] mx-auto" />
                    <span className="text-sm line-clamp-2 h-[3.5rem] pt-2">{nft.dataNftsMetadata.name}</span>
                    <span className="text-xs text-muted-foreground line-clamp-2 h-[2.4rem]">
                      Available supply: {nft.newData.mint.supply.basisPoints.toString()}
                    </span>
                    <Input
                      type="number"
                      placeholder="Amount to send"
                      className="w-[10rem]"
                      onChange={(e) => setAmountToBridge(Number(e.target.value))}
                      max={Number(nft.newData.mint.supply.basisPoints.toString())}
                    />
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
