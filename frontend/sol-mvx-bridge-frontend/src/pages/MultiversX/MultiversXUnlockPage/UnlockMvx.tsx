import React, { useMemo } from "react";
import { ExtensionLoginButton, WalletConnectLoginButton, WebWalletLoginButton } from "@multiversx/sdk-dapp/UI";
import { useNavigate } from "react-router-dom";
import { NativeAuthConfigType } from "@multiversx/sdk-dapp/types";

export const UnlockMvx: React.FC = () => {
  const navigate = useNavigate();

  const nativeAuthProps: NativeAuthConfigType = {
    apiAddress: "https://devnet-api.multiversx.com",
    // origin: window.location.origin,
    expirySeconds: 3600,
  };
  const commonProps = {
    nativeAuth: {
      ...nativeAuthProps,
    },
    callbackRoute: "/mvx",
  };

  const buttonStyles = useMemo(() => {
    return "!rounded-xl !border-0 !bg-teal-500 !shadow-xl !w-full !m-0 !px-10";
  }, []);

  return (
    <div className="shadow-inner shadow-white rounded-xl bg-transparent backdrop-blur-3xl p-14">
      <div className="flex flex-col w-full gap-4">
        <ExtensionLoginButton className={buttonStyles} loginButtonText={"Extension"} {...commonProps} />
        <WalletConnectLoginButton className={buttonStyles} loginButtonText={"xPortal"} {...commonProps} />
        <WebWalletLoginButton className={buttonStyles} loginButtonText={"Web wallet"} {...commonProps} />
      </div>
    </div>
  );
};
