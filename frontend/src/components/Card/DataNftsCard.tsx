import React from "react";
import { DataNft } from "@itheum/sdk-mx-data-nft/out";
import { Card, CardContent } from "../../ui/card";

type DataNftsCardProps = {
  dataNft?: any;
  isSolDataNfts?: boolean;
  isSelected?: boolean;
};

export const DataNftsCard: React.FC<DataNftsCardProps> = (props) => {
  const { isSolDataNfts, dataNft, isSelected } = props;
  // console.log(solDataNft);
  // TODO: Add tooltip
  console.log(dataNft);
  return (
    <Card className={isSelected ? "w-[6.5rem] pt-2 hover:bg-card/60 bg-card" : " w-[6.5rem] pt-2 hover:bg-card/60 bg-transparent"}>
      {!isSolDataNfts ? (
        <CardContent className="px-3">
          <img src={dataNft?.nftImgUrl} alt={dataNft?.tokenIdentifier} className="w-[6rem]" />
          <span className="text-xs line-clamp-2 h-[2.4rem] cursor-help pt-2">{dataNft?.tokenName ?? dataNft.title}</span>
        </CardContent>
      ) : (
        <CardContent className="px-3">
          <img src={dataNft?.dataNftsMetadata.image} alt={dataNft?.dataNftsMetadata.symbol} className="w-[6rem]" />
          <span className="text-xs line-clamp-2 h-[2.4rem] cursor-help pt-2">{dataNft?.dataNftsMetadata.name}</span>
        </CardContent>
      )}
    </Card>
  );
};
