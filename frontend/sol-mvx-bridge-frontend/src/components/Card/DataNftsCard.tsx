import React from "react";
import { DataNft } from "@itheum/sdk-mx-data-nft/out";
import { Card, CardContent } from "../../ui/card";

type DataNftsCardProps = {
  mvxDataNft?: DataNft;
  solDataNft?: any;
  isSelected?: boolean;
};

export const DataNftsCard: React.FC<DataNftsCardProps> = (props) => {
  const { mvxDataNft, isSelected } = props;

  // TODO: Add tooltip
  return (
    <Card className={isSelected ? "w-[6.5rem] pt-2 hover:bg-card/60 bg-card" : " w-[6.5rem] pt-2 hover:bg-card/60 bg-transparent"}>
      <CardContent className="px-3">
        <img src={mvxDataNft?.nftImgUrl} alt={mvxDataNft?.tokenIdentifier} className="w-[6rem]" />
        <span className="text-xs line-clamp-2 h-[2.4rem] cursor-help pt-2">{mvxDataNft?.title}</span>
      </CardContent>
    </Card>
  );
};
