import Hero from "../components/Hero";
import LatestResults from "../components/LatestResults";
import UpcomingFixtures from "../components/UpcomingFixtures";
import TeamPreview from "../components/TeamPreview";
import NewsPreview from "../components/NewsPreview";
import SupporterSpotlight from "../components/SupporterSpotlight";


function Home() {
  return (
    <main className="home">
      <Hero />
      <LatestResults />
      <UpcomingFixtures />
      <TeamPreview />
      <NewsPreview />
      <SupporterSpotlight />
    </main>
  );
}

export default Home;