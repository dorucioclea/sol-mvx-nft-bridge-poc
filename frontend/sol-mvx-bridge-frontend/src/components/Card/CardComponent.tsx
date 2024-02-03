import React, { Dispatch, SetStateAction } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../ui/card";
import { DataNft } from "@itheum/sdk-mx-data-nft/out";
import { DataNftsCard } from "./DataNftsCard";
import { Button } from "../../ui/button";
import { Alert, AlertDescription, AlertTitle } from "../../ui/alert";
import { AlertCircle } from "lucide-react";

type CardComponentProps = {
  title: string;
  imgSrc: string;
  logo: string;
  alt: string;
  isLoggedIn: boolean;
  dataNfts: Array<DataNft>;
  selectedDataNfts: Array<DataNft>;
  setSelectedDataNfts: Dispatch<SetStateAction<Array<DataNft>>>;
};
export const CardComponent: React.FC<CardComponentProps> = (props) => {
  const { title, imgSrc, alt, logo, isLoggedIn, dataNfts, selectedDataNfts, setSelectedDataNfts } = props;
  // console.log(selectedDataNfts);

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
        <div className="flex flex-col justify-center items-center gap-4">
          <img src={imgSrc} alt={alt} className=" h-[10rem]" />
          <img src={logo} alt={alt} className="w-40" />
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap border rounded-md m-1.5 h-[20rem] overflow-y-scroll gap-2 py-3">
        {isLoggedIn ? (
          dataNfts?.map((dataNft, index) => (
            <div key={index} onClick={() => updateDataNfts(dataNft)}>
              <DataNftsCard mvxDataNft={dataNft} isSelected={isSelected(dataNft)} />
            </div>
          ))
        ) : (
          <div className="flex justify-center items-center w-full">
            <Alert variant="warning">
              <AlertCircle className="w-5 h-5" />
              <AlertTitle>Take it slow</AlertTitle>
              <AlertDescription>First login with your wallet</AlertDescription>
            </Alert>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};
