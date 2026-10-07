function Home() {
  return (
    <main className="home">
      <section className="hero">
        <div className="hero-content">
          <p className="hero-eyebrow">WELCOME TO STAREHE FC</p>

          <h1>
            ONE CLUB.
            <br />
            ONE FAMILY.
            <br />
            ONE DREAM.
          </h1>

          <p className="hero-text">
            Passion. Pride. Football.
          </p>

          <div className="hero-actions">
            <a href="/fixtures" className="hero-button hero-button-primary">
              View Fixtures
            </a>

            <a href="/team" className="hero-button hero-button-secondary">
              Meet The Team
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;