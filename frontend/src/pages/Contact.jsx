function Contact() {
  return (
    <main className="contact-page">

      <section className="page-hero">
        <div className="section-container">

          <p className="section-eyebrow">
            STAREHE FC
          </p>

          <h1>
            Get in touch.
          </h1>

          <p>
            We'd love to hear from you.
          </p>

        </div>
      </section>


      <section className="contact-content">

        <div className="section-container">

          <div className="contact-grid">

            {/* CONTACT INFORMATION */}

            <div className="contact-info">

              <p className="section-eyebrow">
                CONTACT THE CLUB
              </p>

              <h2>
                Let's talk
                <br />
                football.
              </h2>

              <p className="contact-intro">
                Whether you're a supporter, player,
                partner or simply want to know more
                about Starehe FC, get in touch with us.
              </p>


              <div className="contact-details">

                <div className="contact-detail">
                  <span>PHONE</span>
                  <strong>+254 700 000 000</strong>
                </div>

                <div className="contact-detail">
                  <span>EMAIL</span>
                  <strong>info@starehefc.com</strong>
                </div>

                <div className="contact-detail">
                  <span>LOCATION</span>
                  <strong>Starehe, Kenya</strong>
                </div>

              </div>


              <div className="contact-socials">

                <span>FOLLOW THE CLUB</span>

                <div className="social-links">
                  <a href="#" aria-label="Facebook">
                    Facebook
                  </a>

                  <a href="#" aria-label="Instagram">
                    Instagram
                  </a>

                  <a href="#" aria-label="X">
                    X
                  </a>
                </div>

              </div>

            </div>


            {/* CONTACT FORM */}

            <div className="contact-form-card">

              <form>

                <div className="form-group">
                  <label htmlFor="name">
                    Name
                  </label>

                  <input
                    id="name"
                    type="text"
                    placeholder="Your name"
                  />
                </div>


                <div className="form-group">
                  <label htmlFor="email">
                    Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                  />
                </div>


                <div className="form-group">
                  <label htmlFor="subject">
                    Subject
                  </label>

                  <input
                    id="subject"
                    type="text"
                    placeholder="What would you like to talk about?"
                  />
                </div>


                <div className="form-group">
                  <label htmlFor="message">
                    Message
                  </label>

                  <textarea
                    id="message"
                    rows="6"
                    placeholder="Write your message..."
                  ></textarea>
                </div>


                <button
                  type="submit"
                  className="contact-submit"
                >
                  Send Message →
                </button>

              </form>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}

export default Contact;