import "./App.css";
import { Header } from "./components/Layout/Header";
import { Content } from "./components/Layout/Content";
import { Footer } from "./components/Layout/Footer";
import { Home } from "./pages/Home/Home";
import { Outlet, Route, Routes } from "react-router-dom";
import { UnlockMvx } from "./pages/MultiversX/MultiversXUnlockPage/UnlockMvx";
import { UnlockSol } from "./pages/Solana/SolanaUnlockPage/UnlockSol";
import { BlockchainWrapper } from "./components/Wrapper/BlockchainWrapper";
import { SolNfts } from "./pages/Solana/SolNfts/SolNfts";
import { MultiversXNfts } from "./pages/MultiversX/MultiversXNfts/MultiversXNfts";
import { SolHome } from "./pages/Solana/Home/SolHome";
import { MvxHome } from "./pages/MultiversX/Home/MvxHome";
import { Bridge } from "./pages/Bridge/Bridge";
import { StoreProvider } from "./store/StoreProvider";
import { SolInventory } from "./pages/Solana/SolInventory/SolInventory";

function App() {
  return (
    <>
      <StoreProvider>
        <div className="">
          <div className="backgroundCircle"></div>
          <div className="backgroundCircle1"></div>
          <div className="flex flex-col min-h-[100svh] text-white backdrop-blur-xl">
            <Header />
            <BlockchainWrapper>
              <>
                <Routes>
                  <Route path="/" element={<Home />} />
                </Routes>
                <Content>
                  <Routes>
                    <Route path="bridge" element={<Bridge />} />

                    <Route path="sol" element={<Outlet />}>
                      <Route path="" element={<SolHome />} />
                      <Route path="solLogin" element={<UnlockSol />} />
                      <Route path="solNfts" element={<SolNfts />} />
                      <Route path="solInventory" element={<SolInventory />} />
                    </Route>
                    <Route path="mvx" element={<Outlet />}>
                      <Route path="" element={<MvxHome />} />
                      <Route path="mvxLogin" element={<UnlockMvx />} />
                      <Route path="mvxNfts" element={<MultiversXNfts />} />
                    </Route>
                  </Routes>
                </Content>
              </>
            </BlockchainWrapper>
            <Footer />
          </div>
        </div>
      </StoreProvider>
    </>
  );
}

export default App;
