import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import NextMatch from "./components/NextMatch";
import LatestResults from "./components/LatestResults";
import UpcomingFixtures from "./components/UpcomingFixtures";
import TeamPreview from "./components/TeamPreview";
import NewsPreview from "./components/NewsPreview";

function App() {
  return (
    <div>
      <Navbar />
      <Home />
      <NextMatch />
      <LatestResults />
      <UpcomingFixtures />
      <TeamPreview />
      <NewsPreview />
    </div>
  );
}

export default App;