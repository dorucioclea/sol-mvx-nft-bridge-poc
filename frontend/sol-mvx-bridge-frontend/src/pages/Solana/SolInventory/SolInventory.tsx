import React, { useEffect } from "react";
import { useUserStore } from "../../../store/user";
import axios from "axios";
import { Button } from "../../../ui/button";
import bs58 from "bs58";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { Metaplex } from "@metaplex-foundation/js";
import { Card, CardContent, CardHeader } from "../../../ui/card";

export const SolInventory: React.FC = () => {
  const { publicKey } = useUserStore((state) => state);
  const [dataNfts, setDataNfts] = React.useState<Array<any>>([]);

  const ironForgeRPC = "https://rpc.ironforge.network/devnet?apiKey=01HNJAHBRF5A8MXB0VYCMSHNCZ";

  const apikey = "sk_live_0c90f3ae86ee459893a288e32342419f";
  const solanafmBaseUrl = "https://api.solana.fm";
  const walletAddress = publicKey;

  const getAllTokenForAddress = async () => {
    // const textEncoder = new TextEncoder();
    // const textDecoder = new TextDecoder("utf8");
    // const connection = new Connection("https://api.devnet.solana.com");

    // WORKING
    const connection = new Connection(clusterApiUrl("devnet"));
    const mx = Metaplex.make(connection);
    // try {
    //   const data = await mx.nfts().findAllByOwner({ owner: new PublicKey(publicKey) });
    //   console.log(data);
    //   setDataNfts(data);
    // } catch (error) {
    //   console.error(error);
    // }
    // -------------------------
    // try {
    //   const { data } = await axios.get(`${solanafmBaseUrl}/v1/addresses/${walletAddress}/tokens`, {
    //     params: {
    //       accountHash: true,
    //       tokenType: "Fungible",
    //       network: "devnet",
    //     },
    //     headers: {
    //       ApiKey: apikey,
    //       "Content-Type": "application/json",
    //     },
    //   });
    //   console.log(data);
    //   // const url = "https://api.solana.fm/v1/addresses/7MSGH3PVGYae7mEn2AXTt1nfsTyoHQxTG7L91cPFEDWn/tokens?network=devnet";
    // } catch (error: any) {
    //   console.error(error.message);
    // }
    // --------------------------
    // try {
    //   const resp: any = await connection.getParsedTokenAccountsByOwner(new PublicKey(publicKey), {
    //     programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    //   });
    //   const mintId = resp.map((item: any) => item.account.data.parsed.info.mint);
    //   // .result.value.map((item: any) => item.account.rentEpoch);
    //   console.log(value);
    // } catch (error: any) {
    //   console.error(error.message);
    // }

    // --------------------------
    // try {
    //   const value = await connection.getAccountInfo(new PublicKey("7MSGH3PVGYae7mEn2AXTt1nfsTyoHQxTG7L91cPFEDWn"));
    // console.log(value);
    // const apiData = value.getBlob().arrayBuffer();
    // setDataNftsSolAPI(apiData);
    // console.log(Array.from(new Uint8Array(value[0].account.data)));
    // const data = new Uint32Array(value[0].account.data, 4, 4);
    // const decodedData = JSON.parse(JSON.stringify(textDecoder.decode(data)));
    // console.log(decodedData);
    // --------------------------
    const postData = {
      jsonrpc: "2.0",
      id: 1,
      method: "getTokenAccountsByOwner",
      params: [
        publicKey,
        {
          "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
        {
          "encoding": "jsonParsed",
        },
      ],
    };
    //
    const { data } = await axios.post(ironForgeRPC, postData);
    console.log(data);
    const mintIds = data.result.value.map((item: any) => item.account.data.parsed.info.mint);
    const _dataNft: any = [];

    for (const mintId of mintIds) {
      const newData: any = await mx.nfts().findByMint({ mintAddress: new PublicKey(mintId) });
      const { data } = await axios.get(newData.uri);
      _dataNft.push({ newData, dataNftsMetadata: data });
      // console.log(newData.metadataAddress.toString());
    }
    console.log(_dataNft);
    setDataNfts(_dataNft);
    //
    // setDataNfts(mintId);
  };
  const getViewData = async (tokenMint: string) => {
    const getPreaccesMessage = await axios.get("https://sol-mvx-nft-bridge-poc-production.up.railway.app/preaccess?chainId=ED");
    const { signature, publicKey } = await window.solana.signMessage(new TextEncoder().encode(getPreaccesMessage.data.nonce), "utf8");

    const { data } = await axios.get(
      `https://sol-mvx-nft-bridge-poc-production.up.railway.app/acceess?nonce=${getPreaccesMessage.data.nonce}&NFTId=${tokenMint}&signature=${bs58.encode(signature)}&chainId=ED&accessRequesterAddr=${publicKey}&streamInline=0&fwdAllHeaders=1&fwdHeaderKeys=a&nestedIdxToStream=1&_bypassSignatureValidation=false&_bypassNonceValidation=false`
    );
    await window.open(
      `https://sol-mvx-nft-bridge-poc-production.up.railway.app/acceess?nonce=${getPreaccesMessage.data.nonce}&NFTId=${tokenMint}&signature=${bs58.encode(signature)}&chainId=ED&accessRequesterAddr=${publicKey}&streamInline=0&fwdAllHeaders=1&fwdHeaderKeys=a&nestedIdxToStream=1&_bypassSignatureValidation=false&_bypassNonceValidation=false`
    );

    const resAsText = await data.getBlob().arrayBuffer();
    const resAsJson = JSON.stringify(JSON.parse(resAsText), null, 4);
    console.log(resAsText);
    // setDataNftContent(resAsJson);
  };

  useEffect(() => {
    getAllTokenForAddress();
  }, [publicKey]);

  // https://api.solana.fm/v1/addresses/{account-hash}/tokens

  return (
    <div className="flex flex-col justify-center items-left gap-4 w-full my-3">
      <span className="text-3xl font-semibold">My Data NFT's</span>
      <div className="flex flex-row flex-wrap gap-5">
        {dataNfts &&
          dataNfts
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
                <Button onClick={() => getViewData(dataNft.newData.mint.address.toString())}>View Data</Button>
              </Card>
            ))}
      </div>
    </div>
  );
};
