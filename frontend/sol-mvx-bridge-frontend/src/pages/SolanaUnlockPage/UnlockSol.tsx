import React, { useMemo } from "react";
import { Button } from "../../ui/button";
import { getProvider } from "../../../lib/utils";

export const UnlockSol: React.FC = () => {
  const provider = getProvider();
  console.log(provider);

  const connect = async () => {
    if (!provider) return;
    try {
      const resp = await provider.connect();
      console.log(resp.publicKey.toString());
    } catch (err) {
      console.log("User rejected the request.");
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

  // useEffect(() => {
  //   (async () => {
  //
  //   })();
  // }, [provider]);

  const buttonStyles = useMemo(() => {
    return "!rounded-xl !border-0 !bg-teal-500 !shadow-xl !w-full !m-0 !px-10";
  }, []);

  return (
    <div className="shadow-inner shadow-white rounded-xl bg-transparent backdrop-blur-3xl p-14">
      <div className="flex flex-col w-full gap-4">
        <Button className={buttonStyles} onClick={connect}>
          Connect
        </Button>
      </div>
    </div>
  );
};
