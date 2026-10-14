import { Link } from "react-router-dom";
import supporterImage from "../assets/jmclegacy.png";

function SupporterSpotlight() {
  return (
    <section className="supporter-section" aria-labelledby="supporter-heading">
      <div className="section-container">
        <div className="supporter-spotlight">
          <div className="supporter-copy">
            <p className="section-eyebrow">WITH GRATITUDE</p>
            <h2 id="supporter-heading">Celebrating our supporters</h2>
            <p>
              Starehe FC is proud to recognize the people and organizations
              who stand behind grassroots football and our community. Thank you
              to the JMCLegacy Foundation for your support.
            </p>
            <a
              className="supporter-link"
              href="https://www.jmclegacy.org/our-impact"
              target="_blank"
              rel="noopener noreferrer"
            >
              Discover their community impact
            </a>
            <Link className="supporter-cta" to="/contact">
              Want to support us?
            </Link>
          </div>
          <img
            className="supporter-image"
            src={supporterImage}
            alt="Jacob Macharia Chege Foundation, official partner supporting grassroots football in Ndaragwa"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}

export default SupporterSpotlight;
