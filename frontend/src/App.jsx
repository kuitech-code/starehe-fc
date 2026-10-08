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

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* WEBSITE */}

        <Route
          path="/*"
          element={
            <>
              <Navbar />

              <Routes>
                <Route path="/" element={<Home />} />
                <Route
                  path="/fixtures"
                  element={<Fixtures />}
                />
                <Route
                  path="/results"
                  element={<Results />}
                />
                <Route
                  path="/table"
                  element={<Table />}
                />
                <Route
                  path="/team"
                  element={<Team />}
                />
                <Route
                  path="/news"
                  element={<News />}
                />
                <Route
                  path="/about"
                  element={<About />}
                />
                <Route
                  path="/contact"
                  element={<Contact />}
                />
              </Routes>

              <Footer />
            </>
          }
        />

        {/* ADMIN */}

        <Route path="/admin" element={<AdminLayout />}>
          <Route
            index
            element={<AdminDashboard />}
          />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;