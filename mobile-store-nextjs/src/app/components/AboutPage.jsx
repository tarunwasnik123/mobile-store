import './PageStyles.css';

export default function AboutPage() {
  return (
    <div className="page">
      <div className="about-wrapper">
        <h1>About Us</h1>

        <section className="about-section">
          <h2>About Handset News</h2>
          <p>
            Welcome to Handset News, a definitive tech portal dedicated to
            smartphone analytics, data-driven comparisons, and real-time mobile
            industry updates. In a market saturated with marketing hype, we act
            as a transparent filter to provide users with accurate, actionable,
            and verified information.
          </p>
        </section>

        <section className="about-section">
          <h2>Our Mission</h2>
          <p>
            Our mission is to empower every mobile buyer with the truth. We
            believe that choosing a smartphone should be a calculated decision,
            not a gamble. Whether it is a flagship device or a budget-friendly
            daily driver, every user deserves to know exactly what they are
            investing in. Our platform simplifies complex technical jargon into
            honest, human-centric insights.
          </p>
        </section>

        <section className="about-section">
          <h2>What We Offer</h2>
          <ul>
            <li>
              <strong>Deep-Dive Specifications:</strong> Our database goes
              beyond basic numbers. We verify every sensor, frequency band, and
              display metric to ensure a 360-degree view of the hardware.
            </li>
            <li>
              <strong>The Practical Context:</strong> We focus on the Indian
              User Experience, analyzing local service center availability,
              real-world battery performance in local climates, and the
              long-term ownership value of a device.
            </li>
            <li>
              <strong>Independent Analysis:</strong> Our editorial team operates
              with strict independence. We do not accept brand-influenced
              rankings. If a device has a flaw, we highlight it.
            </li>
          </ul>
        </section>

        <section className="about-section">
          <h2>How We Work (Our Methodology)</h2>
          <p>
            We don't just list specifications; we analyze them. Our research
            wing follows a rigorous workflow:
          </p>
          <ul>
            <li>
              <strong>Data Aggregation:</strong> We collect information from
              official whitepapers and verified global leaks.
            </li>
            <li>
              <strong>Comparative Analysis:</strong> Our engine maps devices
              against competitors, focusing on the price-to-performance ratio.
            </li>
            <li>
              <strong>Quality Check:</strong> Every spec sheet is manually
              reviewed by technical editors to remove marketing gimmicks.
            </li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Our Data Sources</h2>
          <ul>
            <li>Official Manufacturer Documentation and Product Pages.</li>
            <li>
              Global Telecommunication Databases for network and hardware
              verification.
            </li>
            <li>
              Direct Field Research regarding local retail pricing and repair
              estimates.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}