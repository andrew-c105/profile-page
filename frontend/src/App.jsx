import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import Notes from "./pages/Notes";
import Games from "./pages/Games";
import Game2048 from "./pages/Game2048";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/games" element={<Games />} />
          <Route path="/games/2048" element={<Game2048 />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

