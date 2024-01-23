import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { Header } from "./components/Layout/Header";
import { Content } from "./components/Layout/Content";
import { Footer } from "./components/Layout/Footer";
import { AuthenticatedRoutesWrapper, DappProvider } from "@multiversx/sdk-dapp/wrappers";
import { Home } from "./pages/Home/Home";
import { Route, Routes } from "react-router-dom";
import { NotificationModal, SignTransactionsModals, TransactionsToastList } from "@multiversx/sdk-dapp/UI";
import { apiTimeout, walletConnectV2ProjectId } from "./config";
import { UnlockMvx } from "./pages/MultiversXUnlockPage/UnlockMvx";
import { UnlockSol } from "./pages/SolanaUnlockPage/UnlockSol";
import { BlockchainWrapper } from "./components/Wrapper/BlockchainWrapper";

const routes = [
  {
    path: "/",
    title: "Home",
    component: Home,
    authenticatedRoute: false,
  },
];

function App() {
  return (
    <>
      <div className="">
        <div className="backgroundCircle"></div>
        <div className="backgroundCircle1"></div>
        <div className="flex flex-col min-h-[100svh] text-white backdrop-blur-xl">
          <Header />
          <BlockchainWrapper>
            <Content>
              <Routes>
                <Route path="/" element={<Home />}></Route>
                <Route path="/mvxLogin" element={<UnlockMvx />}></Route>
                <Route path="/solLogin" element={<UnlockSol />}></Route>
              </Routes>
            </Content>
          </BlockchainWrapper>
          <Footer />
        </div>
      </div>
    </>
  );
}

export default App;
