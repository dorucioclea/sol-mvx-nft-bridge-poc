import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../ui/card";
import { DataNft } from "@itheum/sdk-mx-data-nft/out";
import { DataNftsCard } from "./DataNftsCard";

type CardComponentProps = {
  title: string;
  imgSrc: string;
  alt: string;
  dataNfts?: Array<DataNft>;
};
export const CardComponent: React.FC<CardComponentProps> = (props) => {
  const { title, imgSrc, alt, dataNfts } = props;

  return (
    <Card className="w-[26rem]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center items-center">
          <img src={imgSrc} alt={alt} className="w-4/4" />
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap border rounded-md m-1.5 h-[13rem] overflow-y-scroll gap-2 py-3">
        {dataNfts?.map((dataNft) => <DataNftsCard dataNft={dataNft} />)}
      </CardFooter>
    </Card>
  );
};
