import { HashRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Fixtures from "./pages/Fixtures";
import Results from "./pages/Results";
import Table from "./pages/Table";
import Team from "./pages/Team";
import News from "./pages/News";
import About from "./pages/About";
import Contact from "./pages/Contact";

import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import AdminFixtures from "./admin/AdminFixtures";
import AdminResults from "./admin/AdminResults";
import AdminPlayers from "./admin/AdminPlayers";

function PublicLayout() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/fixtures" element={<Fixtures />} />
        <Route path="/results" element={<Results />} />
        <Route path="/table" element={<Table />} />
        <Route path="/team" element={<Team />} />
        <Route path="/news" element={<News />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>

      <Footer />
    </>
  );
}

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* PUBLIC WEBSITE */}
        <Route path="/*" element={<PublicLayout />} />

        {/* ADMIN */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="fixtures" element={<AdminFixtures />} />
          <Route path="results" element={<AdminResults />} />
          <Route path="players" element={<AdminPlayers />} />

        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;