import React from "react";
import { DataNft } from "@itheum/sdk-mx-data-nft/out";
import { Card, CardContent } from "../../ui/card";

type DataNftsCardProps = {
  dataNft?: DataNft;
};

export const DataNftsCard: React.FC<DataNftsCardProps> = (props) => {
  const { dataNft } = props;

  // TODO: Add tooltip
  return (
    <Card className="w-[6.5rem] pt-2">
      <CardContent>
        <img src={dataNft?.nftImgUrl} alt={dataNft?.tokenIdentifier} className="w-[6rem]" />
        <span className="text-sm line-clamp-2 h-[2.5rem] cursor-help">{dataNft?.title}</span>
      </CardContent>
    </Card>
  );
};
