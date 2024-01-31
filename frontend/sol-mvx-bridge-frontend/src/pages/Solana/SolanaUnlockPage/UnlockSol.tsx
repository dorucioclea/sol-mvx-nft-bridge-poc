import React, { useEffect, useMemo } from "react";
import { Button } from "../../../ui/button";
import { getProvider, getWalletBalance } from "../../../../lib/utils";
import { useUserStore } from "../../../store/user";
import { PublicKey } from "@solana/web3.js";
import { useNavigate } from "react-router-dom";

export const UnlockSol: React.FC = () => {
  const isSolanaLoggedIn = useUserStore((state) => state.isSolanaLoggedIn);
  const updateIsSolanaLoggedIn = useUserStore((state) => state.updateIsSolanaLoggedIn);
  const updatePublicKey = useUserStore((state) => state.updatePublicKey);
  const provider = getProvider();
  const navigate = useNavigate();
  // console.log(storePublicKey, solanaBalance);

  const connect = async () => {
    if (!provider) return;
    try {
      const resp = await provider.connect({ onlyIfTrusted: true });
      if (resp.publicKey.toString()) {
        updateIsSolanaLoggedIn(true);
      }
      // console.log(balance);
    } catch (err) {
      console.log("User rejected the request.");
      updateIsSolanaLoggedIn(false);
    }
  };
  const disconnect = async () => {
    if (!provider) return;
    try {
      const resp = await provider.disconnect();
      console.log(resp.publicKey.toString());
    } catch (err) {
      console.log("User rejected the request.");
    }
  };
  // console.log(isSolanaLoggedIn);

  useEffect(() => {
    provider.on("connect", (publicKey: PublicKey) => {
      // console.log(balance);
      updatePublicKey(publicKey.toString());
      updateIsSolanaLoggedIn(true);
      localStorage.setItem("solanaPublicKey", publicKey.toString());
      navigate("/sol/solanaNfts");
    });
    provider.on("disconnect", () => {
      updatePublicKey("");
      updateIsSolanaLoggedIn(false);
      localStorage.setItem("solanaPublicKey", "");
    });
    provider.on("accountChanged", (publicKey: PublicKey) => {
      if (publicKey) {
        updatePublicKey(publicKey.toString());
        console.log(`Switched to account ${publicKey.toBase58()}`);
      }
    });
  }, [provider]);

  const buttonStyles = useMemo(() => {
    return "!rounded-xl !border-0 !bg-teal-500 !shadow-xl !w-full !m-0 !px-10";
  }, []);

  return (
    <div className="shadow-inner shadow-white rounded-xl bg-transparent backdrop-blur-3xl p-14">
      <div className="flex flex-col w-full gap-4">
        {!isSolanaLoggedIn && (
          <Button className={buttonStyles} onClick={connect}>
            Connect
          </Button>
        )}
      </div>
    </div>
  );
};
