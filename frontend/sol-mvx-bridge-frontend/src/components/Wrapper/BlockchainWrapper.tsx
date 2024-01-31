import React, { JSX, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { Home } from "../../pages/Home/Home";
import { apiTimeout, walletConnectV2ProjectId } from "../../config";
import { NotificationModal, SignTransactionsModals, TransactionsToastList } from "@multiversx/sdk-dapp/UI";
import { AuthenticatedRoutesWrapper, DappProvider } from "@multiversx/sdk-dapp/wrappers";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

const routes = [
  {
    path: "/",
    title: "Home",
    component: Home,
    authenticatedRoute: false,
  },
];

type BlockchainWrapperProps = {
  children: JSX.Element;
};

export const BlockchainWrapper: React.FC<BlockchainWrapperProps> = (props) => {
  const { children } = props;
  const [contextComponent, setContextComponent] = useState<JSX.Element>(<></>);
  const { pathname } = useLocation();

  const solNetwork = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(solNetwork), [solNetwork]);
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);
  console.log(contextComponent);
  const isMvx = () => {
    return pathname === "/mvx";
  };

  const isSol = () => {
    return pathname === "/sol";
  };
  const isBridge = () => {
    return pathname === "/bridge";
  };

  useEffect(() => {
    if (isMvx()) {
      console.log("isMvx", isMvx());
      setContextComponent(
        <DappProvider
          environment={"devnet"}
          customNetworkConfig={{
            name: "customConfig",
            apiTimeout,
            walletConnectV2ProjectId,
          }}>
          <TransactionsToastList successfulToastLifetime={1000} customToastClassName="absolute" />
          <NotificationModal />
          <SignTransactionsModals className="custom-class-for-modals" />
          <AuthenticatedRoutesWrapper routes={routes} unlockRoute="/unlock">
            {children}
          </AuthenticatedRoutesWrapper>
        </DappProvider>
      );
    } else if (isSol()) {
      console.log("isSol", isSol());

      setContextComponent(
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets}>
            <WalletModalProvider>{children}</WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      );
    } else if (isBridge()) {
      console.log("bridge", isBridge());

      setContextComponent(
        <DappProvider
          environment={"devnet"}
          customNetworkConfig={{
            name: "customConfig",
            apiTimeout,
            walletConnectV2ProjectId,
          }}>
          <TransactionsToastList successfulToastLifetime={1000} customToastClassName="absolute" />
          <NotificationModal />
          <SignTransactionsModals className="custom-class-for-modals" />
          <AuthenticatedRoutesWrapper routes={routes} unlockRoute="/unlock">
            <ConnectionProvider endpoint={endpoint}>
              <WalletProvider wallets={wallets}>
                <WalletModalProvider>{children}</WalletModalProvider>
              </WalletProvider>
            </ConnectionProvider>
          </AuthenticatedRoutesWrapper>
        </DappProvider>
      );
    }
  }, [pathname]);

  return <>{contextComponent}</>;
};
