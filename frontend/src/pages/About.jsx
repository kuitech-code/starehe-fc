function About() {
  const values = [
    {
      number: "01",
      title: "Passion",
      text: "We play with heart, commitment and pride every time we step onto the pitch.",
    },
    {
      number: "02",
      title: "Discipline",
      text: "We believe excellence comes from consistency, hard work and doing things the right way.",
    },
    {
      number: "03",
      title: "Community",
      text: "Starehe FC belongs to its people. We believe football has the power to bring communities together.",
    },
    {
      number: "04",
      title: "Ambition",
      text: "We are always looking forward, always improving and always believing that we can achieve more.",
    },
  ];

  return (
    <main className="about-page">

      {/* PAGE HERO */}

      <section className="page-hero">
        <div className="section-container">

          <p className="section-eyebrow">
            STAREHE FC
          </p>

          <h1>
            More than a club.
          </h1>

          <p>
            Football, community and ambition.
          </p>

        </div>
      </section>


      {/* OUR STORY */}

      <section className="about-story">
        <div className="section-container">

          <div className="about-story-grid">

            <div className="about-story-heading">

              <p className="section-eyebrow">
                OUR STORY
              </p>

              <h2>
                Built on football.
                <br />
                Driven by people.
              </h2>

            </div>


            <div className="about-story-content">

              <p>
                Starehe FC is a football club built around
                a simple belief: football is about more than
                what happens for ninety minutes on a pitch.
              </p>

              <p>
                It is about the players who give everything
                they have, the supporters who stand behind
                them, and the community that gives the club
                its identity.
              </p>

              <p>
                We are building a club that is ambitious on
                the pitch, connected to its community and
                committed to creating opportunities for
                talented players to grow.
              </p>

            </div>

          </div>

        </div>
      </section>


      {/* IDENTITY */}

      <section className="about-identity">

        <div className="section-container">

          <div className="about-identity-content">

            <p className="section-eyebrow">
              OUR IDENTITY
            </p>

            <h2>
              One club.
              <br />
              One family.
              <br />
              One dream.
            </h2>

            <p>
              Every player, coach, supporter and member
              of the Starehe FC family contributes to
              something bigger than themselves.
            </p>

          </div>

        </div>

      </section>


      {/* VALUES */}

      <section className="about-values">

        <div className="section-container">

          <div className="section-heading">

            <p className="section-eyebrow">
              WHAT WE STAND FOR
            </p>

            <h2>
              Our values.
            </h2>

          </div>


          <div className="values-grid">

            {values.map((value) => (

              <article
                className="value-card"
                key={value.number}
              >

                <span className="value-number">
                  {value.number}
                </span>

                <h3>
                  {value.title}
                </h3>

                <p>
                  {value.text}
                </p>

              </article>

            ))}

          </div>

        </div>

      </section>


      {/* VISION */}

      <section className="about-vision">

        <div className="section-container">

          <div className="vision-card">

            <p className="section-eyebrow">
              OUR VISION
            </p>

            <h2>
              Building something
              <br />
              worth belonging to.
            </h2>

            <p>
              We want Starehe FC to become a club that
              players are proud to represent, supporters
              are proud to follow and the community is
              proud to call its own.
            </p>

          </div>

        </div>

      </section>

    </main>
  );
}

export default About;