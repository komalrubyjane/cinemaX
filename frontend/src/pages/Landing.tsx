import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Landing.css";

const faqs = [
  {
    q: "What is CINEMAX?",
    a: "CINEMAX is a streaming service that offers a wide variety of award-winning TV shows, movies, anime, documentaries and more powered by an AI recommendation engine. You can watch as much as you want, whenever you want, without a single ad."
  },
  {
    q: "How much does CINEMAX cost?",
    a: "Watch CINEMAX on your smartphone, tablet, Smart TV, laptop, or streaming device, all for one fixed monthly fee."
  },
  {
    q: "How does the AI recommendation work?",
    a: "Our Netflix-style recommendation system uses content-based and collaborative filtering. It automatically suggests movies and TV shows you're most likely to enjoy by analyzing your viewing behavior and similar users' tastes to provide accurate 'Top picks for you'."
  },
  {
    q: "What is the Watch Party feature?",
    a: "Watch Party lets you join a virtual room with friends and watch videos synchronized in real-time, completely redefining how you watch movies together."
  },
  {
    q: "Where can I watch?",
    a: "Watch anywhere, anytime. Sign in to your CINEMAX account to watch instantly on the web from your personal computer or on any internet-connected device."
  },
  {
    q: "How do I cancel?",
    a: "CINEMAX is flexible. There are no annoying contracts and no commitments. You can easily cancel your account online."
  }
];

export function Component() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/signup");
  };

  return (
    <div style={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
      <div className="hero">
        <div className="overlay">
          <header>
            <div className="header-container" style={{ padding: '1.5rem 40px' }}>
              <h1 style={{ color: '#87CEEB', margin: 0, fontFamily: "'Outfit', 'Inter', sans-serif", fontSize: '2.5rem', letterSpacing: '-1px', fontWeight: 950 }}>
                CINEMAX
              </h1>

              <div className="top-right">
                <select className="language-select">
                  <option value="en">English</option>
                  <option value="hi">हिंदी</option>
                </select>
                <button onClick={() => navigate("/login")} className="sign-in-btn">
                  Sign In
                </button>
              </div>
            </div>
          </header>

          <div className="main-content">
            <h1><b>Unlimited movies, TV <br />shows and more</b></h1>
            <h3>Powered by AI. Personalized for you.</h3>
            <p>Ready to watch? Enter your email to create or restart your membership.</p>

            <div className="email-form">
              <form className="email-form" onSubmit={handleGetStarted}>
                <input type="email" name="email" placeholder="Email address" required className="email-input" />
                <button type="submit" className="submit-button">
                  <b>Get Started &gt;</b>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="border-divider"></div>

      <section className="trending">
        <h2><b>Trending Now</b></h2>
        <div className="scroll-row">
          {[
            "https://bollynewsuk.com/wp-content/uploads/2023/07/heart-of-stone-uk-netflix-poster-2.jpg",
            "https://m.media-amazon.com/images/I/61boFr6SYZL._AC_UF1000,1000_QL80_.jpg",
            "https://i.pinimg.com/736x/1e/db/c8/1edbc806d8d04d773fea15cd9a98aaf5.jpg",
            "https://pbs.twimg.com/media/FWqj1NFacAAG50f.jpg",
            "https://d1csarkz8obe9u.cloudfront.net/posterpreviews/thriller-movie-poster-template-design-60810b48f828d913da224f313a7732d1_screen.jpg?ts=1669109260",
            "https://cdn.dribbble.com/userupload/15632169/file/original-e8c1abbabd1f0100eeb8a927258db3d9.jpg?resize=400x0",
            "https://m.media-amazon.com/images/I/71ntZpru-4L.jpg",
            "https://64.media.tumblr.com/eacd7bc6999b55477cf2dc9f20c318e6/abcb2dee99d386d3-81/s2048x3072/f97d62eb3a4aad1547b25f28b20286c165896a0a.jpg",
            "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/2518eb113535837.602a4c183dd5d.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRt4tizac49jL5xgHYhdHnqRFO37Avua0wVSg&s"
          ].map((src, i) => (
            <div className="card" key={i}>
              <img src={src} alt={`Movie ${i + 1}`} />
              <span className="rank-number">{i + 1}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="reasons">
        <h2><b>More Reasons to Join</b></h2>
        <div className="reasons-grid">
          <div className="reason-card">
            <img src="/assets/icons8-tv-50.png" alt="Icon" className="corner-icon" />
            <h3>Enjoy on your TV</h3>
            <p>Watch on smart TVs, PlayStation, Xbox, Chromecast, Apple TV, Blu-ray players and more.</p>
          </div>
          <div className="reason-card">
            <img src="/assets/icons8-download-50 (1).png" alt="Icon" className="corner-icon" />
            <h3>Download your shows to watch offline</h3>
            <p>Save your favourites easily and always have something to watch.</p>
          </div>
          <div className="reason-card">
            <img src="/assets/icons8-stargaze-50.png" alt="Icon" className="corner-icon" />
            <h3>Watch everywhere</h3>
            <p>Stream unlimited movies and TV shows on your phone, tablet, laptop and TV.</p>
          </div>
          <div className="reason-card">
            <img src="/assets/icons8-profile-48.png" alt="Icon" className="corner-icon" />
            <h3>Create profiles for kids</h3>
            <p>Send kids on adventures with their favourite characters in a space made just for them — free with your membership.</p>
          </div>
        </div>
      </section>

      <section className="faq-section">
        <div className="faq-container">
          <h2><b>Frequently Asked Questions</b></h2>

          {faqs.map((faq, index) => (
            <div className={`faq-item ${openFaq === index ? "open" : ""}`} key={index}>
              <div className="faq-question" onClick={() => toggleFaq(index)}>
                <span style={{ color: '#141414' }}>{faq.q}</span>
                <span className="toggle" style={{ color: '#141414' }}>{openFaq === index ? "×" : "+"}</span>
              </div>
              <div className="faq-answer" style={{ display: openFaq === index ? "block" : "none", color: '#333' }}>
                {faq.a}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="footer-email-section">
        <p className="footer-title">
          Ready to watch? Enter your email to create or restart your membership.
        </p>
        <form className="email-form" onSubmit={handleGetStarted}>
          <input type="email" name="email" placeholder="Email address" required className="email-input" />
          <button type="submit" className="submit-button">
            <b>Get Started &gt;</b>
          </button>
        </form>
      </section>

      <footer className="footer-links-section" style={{ paddingBottom: '40px' }}>
        <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '40px' }}>
          <div className="footer-col about">
            <h3 style={{ color: '#0071eb', fontWeight: 900, marginBottom: '20px' }}>CINEMAX</h3>
            <p style={{ color: '#555', lineHeight: '1.6', fontSize: '0.9rem' }}>
              CINEMAX is the ultimate destination for curated cinematic excellence. 
              Powered by state-of-the-art AI, we define the future of how you watch, 
              interact, and enjoy movies with your friends and family.
            </p>
          </div>
          
          <div className="footer-col links">
            <h4 style={{ color: '#141414', fontWeight: 700, marginBottom: '20px' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><a href="#" style={{ color: '#555', textDecoration: 'none', fontSize: '0.9rem' }}>FAQ</a></li>
              <li><a href="#" style={{ color: '#555', textDecoration: 'none', fontSize: '0.9rem' }}>Help Center</a></li>
              <li><a href="#" style={{ color: '#555', textDecoration: 'none', fontSize: '0.9rem' }}>Terms of Use</a></li>
              <li><a href="#" style={{ color: '#555', textDecoration: 'none', fontSize: '0.9rem' }}>Privacy Policy</a></li>
            </ul>
          </div>
          
          <div className="footer-col contact">
            <h4 style={{ color: '#141414', fontWeight: 700, marginBottom: '20px' }}>Contact</h4>
            <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: '10px' }}>Questions? Call 000-800-919-1743</p>
            <div className="footer-language-selector" style={{ marginTop: '20px' }}>
              <select style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option>English</option>
                <option>हिन्दी</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border-divider" style={{ margin: '20px 0', opacity: 0.2 }}></div>

        <div className="footer-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.7 }}>
          <div className="footer-copy">
            <b>CINEMAX India</b>
          </div>
          <div className="footer-copyright" style={{ fontSize: '0.8rem' }}>
            © 2026 CINEMAX India. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

Component.displayName = "LandingPage";
