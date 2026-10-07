import Hero from "../components/Hero";
import NextMatch from "../components/NextMatch";
import LatestResults from "../components/LatestResults";
import UpcomingFixtures from "../components/UpcomingFixtures";
import TeamPreview from "../components/TeamPreview";
import NewsPreview from "../components/NewsPreview";


function Home() {
  return (
    <main className="home">
      <Hero />
      <NextMatch />
      <LatestResults />
      <UpcomingFixtures />
      <TeamPreview />
      <NewsPreview />
    </main>
  );
}

export default Home;