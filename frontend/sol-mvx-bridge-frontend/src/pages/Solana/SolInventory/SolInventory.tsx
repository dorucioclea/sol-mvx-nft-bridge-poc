import React, { useEffect } from "react";
import { useUserStore } from "../../../store/user";
import axios from "axios";
import { Connection } from "@solana/web3.js";
import { Button } from "../../../ui/button";
import bs58, { decode } from "bs58";

export const SolInventory: React.FC = () => {
  const { publicKey } = useUserStore((state) => state);
  const [dataNfts, setDataNfts] = React.useState<any[]>([]);
  const [dataNftContent, setDataNftContent] = React.useState<any>();
  // console.log(publicKey);

  // {"method":"getTokenAccountsByOwner",
  // "jsonrpc":"2.0",
  // "params":["B217DJ814SVSGSHS7SiRjv3CTFBFnLL41VkMD7sYnqa",
  // {"programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},
  // {"encoding":"jsonParsed","commitment":"processed"}],
  // "id":"a96bc4e3-dc32-4413-ba8e-9f596e9ac529"}

  const solanaAPI = "https://api.devnet.solana.com";
  const getAllTokenForAddress = async () => {
    const textDecoder = new TextDecoder();
    const connection = new Connection("https://api.devnet.solana.com");

    //
    // const wallet = Keypair.generate();
    //
    // const metaplex = Metaplex.make(connection);
    // const nft = await metaplex.nfts().findByMint({ mintAddress: new PublicKey("7MSGH3PVGYae7mEn2AXTt1nfsTyoHQxTG7L91cPFEDWn") });
    // try {
    //   const { value } = await connection.getTokenAccountsByOwner(new PublicKey(publicKey), {
    //     programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    //   });
    //   console.log(value[1].account.data.toString());
    // } catch (error) {
    //   console.error(error);
    // }
    const postData = {
      jsonrpc: "2.0",
      id: 1,
      method: "getTokenAccountsByOwner",
      params: [
        publicKey,
        {
          mint: "7MSGH3PVGYae7mEn2AXTt1nfsTyoHQxTG7L91cPFEDWn",
        },
        {
          encoding: "jsonParsed",
        },
      ],
    };
    //
    const response = await axios.post(solanaAPI, postData);
    setDataNfts(response.data.result.value);
    console.log(response.data.result.value[0].account.data.parsed.info);
  };

  const getViewData = async (tokenMint: string) => {
    const getPreaccesMessage = await axios.get("https://sol-mvx-nft-bridge-poc-production.up.railway.app/preaccess?chainId=ED");
    const { signature, publicKey } = await window.solana.signMessage(new TextEncoder().encode(getPreaccesMessage.data.nonce), "utf8");

    const query = await axios.get(
      `https://sol-mvx-nft-bridge-poc-production.up.railway.app/acceess?nonce=${getPreaccesMessage.data.nonce}&NFTId=${tokenMint}&signature=${bs58.encode(signature)}&chainId=ED&accessRequesterAddr=${publicKey}&streamInline=0&fwdAllHeaders=1&fwdHeaderKeys=a&nestedIdxToStream=1&_bypassSignatureValidation=false&_bypassNonceValidation=false`
    );
    await window.open(
      `https://sol-mvx-nft-bridge-poc-production.up.railway.app/acceess?nonce=${getPreaccesMessage.data.nonce}&NFTId=${tokenMint}&signature=${bs58.encode(signature)}&chainId=ED&accessRequesterAddr=${publicKey}&streamInline=0&fwdAllHeaders=1&fwdHeaderKeys=a&nestedIdxToStream=1&_bypassSignatureValidation=false&_bypassNonceValidation=false`
    );
    setDataNftContent(query.data);
    // console.log(
    //   `https://sol-mvx-nft-bridge-poc-production.up.railway.app/acceess?nonce=${getPreaccesMessage.data.nonce}&NFTId=${tokenMint}&signature=${bs58.encode(signature)}&chainId=ED&accessRequesterAddr=${publicKey}&streamInline=0&fwdAllHeaders=1&fwdHeaderKeys=a&nestedIdxToStream=1&_bypassSignatureValidation=false&_bypassNonceValidation=false`
    // );
  };

  useEffect(() => {
    getAllTokenForAddress();
  }, [publicKey]);

  // https://api.solana.fm/v1/addresses/{account-hash}/tokens

  return (
    <div>
      {dataNfts.map((dataNft, index) => (
        <div className="mb-3" key={index}>
          <div className="flex flex-col mb-1 gap-3">
            <div className="flex gap-3">
              <span className="opacity-6 base:text-sm md:text-base">Amount:</span>
              <span className="text-left base:text-sm md:text-base">{dataNft.account.data.parsed.info.tokenAmount.amount}</span>
            </div>
            <div className="flex gap-3">
              <span className="col-span-4 opacity-6 base:text-sm md:text-base">Mint:</span>
              <span className="col-span-8 text-left base:text-sm md:text-base">{dataNft.account.data.parsed.info.mint}</span>
            </div>
            <Button onClick={() => getViewData(dataNft.account.data.parsed.info.mint)}>View Data</Button>
            {dataNftContent && (
              <iframe
                src={`https://sol-mvx-nft-bridge-poc-production.up.railway.app/acceess?nonce=ODU4OjE4OToyNDAw&NFTId=7MSGH3PVGYae7mEn2AXTt1nfsTyoHQxTG7L91cPFEDWn&signature=5AkANGgDyLcmAMpt2VsnLqUTxBVnRz6Hpznm2HXLpTZG6ua9Kp7t67XqY3z3uZjL9SYHeRvaojD2VRpjYdaG3WCU&chainId=ED&accessRequesterAddr=B217DJ814SVSGSHS7SiRjv3CTFBFnLL41VkMD7sYnqa&streamInline=0&fwdAllHeaders=1&fwdHeaderKeys=a&nestedIdxToStream=1&_bypassSignatureValidation=false&_bypassNonceValidation=false`}></iframe>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
