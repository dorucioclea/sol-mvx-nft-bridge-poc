import React, { Dispatch, SetStateAction } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../ui/card";
import { DataNft } from "@itheum/sdk-mx-data-nft/out";
import { DataNftsCard } from "./DataNftsCard";
import { Button } from "../../ui/button";

type CardComponentProps = {
  title: string;
  imgSrc: string;
  alt: string;
  dataNfts: Array<DataNft>;
  selectedDataNfts: Array<DataNft>;
  setSelectedDataNfts: Dispatch<SetStateAction<Array<DataNft>>>;
};
export const CardComponent: React.FC<CardComponentProps> = (props) => {
  const { title, imgSrc, alt, dataNfts, selectedDataNfts, setSelectedDataNfts } = props;
  console.log(selectedDataNfts);

  const updateDataNfts = (newDataNft: DataNft) => {
    const index = selectedDataNfts?.findIndex((item) => item.nonce === newDataNft.nonce);

    if (index !== -1) {
      // console.log("Element exists, remove it");
      const updatedDataNfts = [...selectedDataNfts];
      updatedDataNfts.splice(index, 1);
      setSelectedDataNfts(updatedDataNfts);
    } else {
      // console.log("Element doesn't exist, add it");
      setSelectedDataNfts([...selectedDataNfts, newDataNft]);
    }
  };

  const isSelected = (dataNft: DataNft) => {
    const index = selectedDataNfts?.findIndex((item) => item.nonce === dataNft.nonce);
    if (index !== -1) {
      return true;
    } else {
      return false;
    }
  };

  return (
    <Card className="w-[26rem] bg-transparent">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center items-center">
          <img src={imgSrc} alt={alt} className="w-4/4 h-[16rem]" />
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap border rounded-md m-1.5 h-[20rem] overflow-y-scroll gap-2 py-3">
        {dataNfts?.map((dataNft, index) => (
          <div key={index} onClick={() => updateDataNfts(dataNft)}>
            <DataNftsCard dataNft={dataNft} isSelected={isSelected(dataNft)} />
          </div>
        ))}
      </CardFooter>
    </Card>
  );
};
