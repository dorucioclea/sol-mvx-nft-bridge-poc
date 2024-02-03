import React from "react";
import { useUserStore } from "../../../store/user";
import axios from "axios";
import { Button } from "../../../ui/button";
import bs58 from "bs58";
import { Card, CardContent, CardHeader } from "../../../ui/card";
import { SolInventoryModal } from "./components/SolInventoryModal";

export const SolInventory: React.FC = () => {
  const { publicKey } = useUserStore((state) => state);
  const [dataNfts, setDataNfts] = React.useState<Array<any>>([]);
  const [modalContent, setModalContent] = React.useState<string>("");
  const solDataNfts = useUserStore((state) => state.solanaDataNfts);

  const getViewData = async (tokenMint: string) => {
    setModalContent("");
    const getPreaccesMessage = await axios.get("https://sol-mvx-nft-bridge-poc-production.up.railway.app/preaccess?chainId=ED");
    const { signature, publicKey } = await window.solana.signMessage(new TextEncoder().encode(getPreaccesMessage.data.nonce), "utf8");

    const { data } = await axios.get(
      `https://sol-mvx-nft-bridge-poc-production.up.railway.app/acceess?nonce=${getPreaccesMessage.data.nonce}&NFTId=${tokenMint}&signature=${bs58.encode(signature)}&chainId=ED&accessRequesterAddr=${publicKey}&streamInline=0&fwdAllHeaders=1&fwdHeaderKeys=a&nestedIdxToStream=1&_bypassSignatureValidation=false&_bypassNonceValidation=false`
    );
    setModalContent(
      `https://sol-mvx-nft-bridge-poc-production.up.railway.app/acceess?nonce=${getPreaccesMessage.data.nonce}&NFTId=${tokenMint}&signature=${bs58.encode(signature)}&chainId=ED&accessRequesterAddr=${publicKey}&streamInline=0&fwdAllHeaders=1&fwdHeaderKeys=a&nestedIdxToStream=1&_bypassSignatureValidation=false&_bypassNonceValidation=false`
    );

    // const resAsText = await data.getBlob().arrayBuffer();
    // const resAsJson = JSON.stringify(JSON.parse(resAsText), null, 4);
    // console.log(resAsText);
    // setDataNftContent(resAsJson);
  };

  // https://api.solana.fm/v1/addresses/{account-hash}/tokens

  return (
    <div className="flex flex-col justify-center items-left gap-4 w-full my-3">
      <span className="text-3xl font-semibold font-epilogue">My Data NFT's</span>
      <div className="flex flex-row flex-wrap gap-5">
        {solDataNfts &&
          solDataNfts
            .filter((dataNft) => dataNft.newData.model === "sft")
            .map((dataNft, index) => (
              <Card className="flex flex-col gap-3 p-3 text-foreground bg-transparent w-[20rem]" key={index}>
                <CardHeader className="p-2">
                  <img src={dataNft.dataNftsMetadata.image} alt={dataNft.dataNftsMetadata.name} />
                </CardHeader>
                <CardContent className="flex flex-col px-3 gap-2">
                  <div className="flex justify-between">
                    <span className="">Name:</span>
                    <span className="text-muted-foreground">{dataNft.newData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Token address:&nbsp;</span>
                    <span className="text-muted-foreground">
                      {dataNft.newData.mint.address.toString().substring(0, 4)}...
                      {dataNft.newData.mint.address
                        .toString()
                        .substring(dataNft.newData.mint.address.toString().length, dataNft.newData.mint.address.toString().length - 4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Creator Royalties:&nbsp;</span>
                    <span className="text-muted-foreground">{dataNft.dataNftsMetadata.seller_fee_basis_points}%</span>
                  </div>
                  {/*<div className="flex justify-between">*/}
                  {/*  <span>Creator Royalties:&nbsp;</span>*/}
                  {/*  <span className="text-muted-foreground">{dataNft.newData.address.toString()}%</span>*/}
                  {/*</div>*/}
                </CardContent>
                <SolInventoryModal
                  modalContent={modalContent}
                  buttonTrigger={<Button onClick={() => getViewData(dataNft.newData.mint.address.toString())}>View Data</Button>}
                />
              </Card>
            ))}
      </div>
    </div>
  );
};
