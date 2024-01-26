import React from "react";
import { Card, CardContent } from "../../ui/card";
import { DataNft } from "@itheum/sdk-mx-data-nft/out";
import { Input } from "../../ui/input";

type NftsContainerProps = {
  selectedNft: Array<DataNft>;
};

export const NftsContainer: React.FC<NftsContainerProps> = (props) => {
  const { selectedNft } = props;
  console.log(selectedNft);
  return (
    <Card className="bg-transparent">
      <div className="flex flex-col items-center justify-center border-b">
        <span className="py-2 text-2xl">Select NFTs to bridge</span>
      </div>
      <CardContent className="h-[19.5rem] w-[63rem] flex flex-wrap overflow-y-scroll my-2 mx-1 p-0">
        <div className="flex flex-wrap w-full gap-2 px-1">
          {selectedNft?.length === 0 ? (
            <div className="flex justify-center items-center h-[19.5rem] w-full">
              <h1 className="text-2xl text-muted-foreground">No NFTs selected</h1>
            </div>
          ) : (
            selectedNft?.map((nft, index) => (
              <div key={index} className="w-[15rem] h-[16rem] py-2 border rounded-xl px-3 line-clamp-1">
                <img src={nft.nftImgUrl} alt={nft.tokenIdentifier} className="w-[6rem] mx-auto" />
                <span className="text-sm line-clamp-2 h-[3.5rem] pt-2">{nft.title}</span>
                <span className="text-xs text-muted-foreground line-clamp-2 h-[2.4rem]">Available supply: {Number(nft.balance)}</span>
                <Input type="number" placeholder="Amount to send" className="w-[10rem]" max={Number(nft.balance)} />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
