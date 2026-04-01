import React from "react";
import { useNavigate } from "react-router-dom";
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import FireExtinguisherIcon from '@mui/icons-material/FireExtinguisher';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import OpacityIcon from '@mui/icons-material/Opacity';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';

import "./Landing.css";

export function Component() {
  const navigate = useNavigate();

  return (
    <div className="auto-landing">
      {/* HEADER */}
      <header className="auto-header">
        <div className="header-container">
          <div className="logo-section">
            <SettingsIcon sx={{ fontSize: 32, mr: 1, color: '#222' }} />
            <span className="logo-text">AUTOMOTIVE<span className="dot">.</span></span>
          </div>
          
          <nav className="main-nav">
            <a href="#" className="active">HOME</a>
            <a href="#">SHOP <span className="caret">▾</span></a>
            <a href="#">SERVICES <span className="caret">▾</span></a>
            <a href="#">ELEMENTS <span className="caret">▾</span></a>
            <a href="#">BLOG</a>
            <a href="#">GALLERY</a>
          </nav>

          <div className="header-actions">
            <SearchIcon className="action-icon search-icon" />
            <div className="cart-wrapper">
              <span className="cart-text">CART</span>
              <ShoppingCartIcon className="action-icon cart-icon" />
              <span className="cart-badge">0</span>
            </div>
            <button className="quote-btn" onClick={() => navigate('/browse')}>GET A QUOTE</button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="auto-hero">
        <div className="hero-content">
          <p className="hero-subtitle">BEST AUTO SERVICES</p>
          <h1 className="hero-title">Innovative Solutions<br/>For Automobile</h1>
          <button className="learn-more-btn" onClick={() => navigate('/browse')}>LEARN MORE</button>
        </div>
      </section>

      {/* SERVICES BAR */}
      <section className="services-bar">
        <div className="services-left">
          <div className="service-category">
            <h3>Auto Repairs</h3>
            <span className="view-all">+ View all</span>
          </div>
          <div className="service-category">
            <h3>Auto Services</h3>
            <span className="view-all">+ View all</span>
          </div>
        </div>
        <div className="services-right">
          <div className="service-icon-box">
            <VpnKeyIcon sx={{ fontSize: 40 }} className="s-icon" />
            <span>Car Keys</span>
          </div>
          <div className="service-icon-box">
            <FireExtinguisherIcon sx={{ fontSize: 40 }} className="s-icon" />
            <span>Extinguisher</span>
          </div>
          <div className="service-icon-box">
            <OpacityIcon sx={{ fontSize: 40 }} className="s-icon" />
            <span>Fuels</span>
          </div>
          <div className="service-icon-box">
            <LocalGasStationIcon sx={{ fontSize: 40 }} className="s-icon" />
            <span>Gasoline</span>
          </div>
          <div className="service-icon-box">
            <BuildCircleIcon sx={{ fontSize: 40 }} className="s-icon" />
            <span>Steerings</span>
          </div>
          <div className="service-icon-box">
            <MiscellaneousServicesIcon sx={{ fontSize: 40 }} className="s-icon" />
            <span>Transmission</span>
          </div>
        </div>
      </section>

      {/* DIAGNOSTIC SECTION */}
      <section className="diagnostic-section">
        <div className="diag-container">
          <div className="diag-left">
            <p className="section-tag"><span className="red-line">|</span> WHY CHOOSE US</p>
            <h2 className="section-heading">We Offer A Complete<br/>Diagnostic For Your Car</h2>
            <p className="section-desc">
              Vehicles are becoming ever more complex and challenging to repair. 
              Our service has the upper hand in overcoming these challenges by 
              pairing technology and innovation.
            </p>
            <ul className="check-list">
              <li><CheckCircleIcon className="check-icon" /> WE HAVE 24/7 EMERGENCY HOTLINE</li>
              <li><CheckCircleIcon className="check-icon" /> MOBILE DIAGNOSTIC SERVICE AT HOME</li>
              <li><CheckCircleIcon className="check-icon" /> MANAGE YOUR CAR ONLINE 24/7</li>
            </ul>
          </div>
          <div className="diag-right">
            <img src="https://images.unsplash.com/photo-1594953181816-608bfa2e9a3b?auto=format&fit=crop&w=400&q=80" alt="Classic Car" className="diag-img-1" />
            <img src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=400&q=80" alt="Mechanic" className="diag-img-2" />
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-box">
            <div className="stat-number">674</div>
            <div className="stat-label">HAPPY CLIENTS</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">987</div>
            <div className="stat-label">VEHICLE REPAIRED</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">015</div>
            <div className="stat-label">YEAR OF EXPERIENCE</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">049</div>
            <div className="stat-label">AWARDS WINNING</div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID SECTION */}
      <section className="features-section">
        <div className="features-grid">
          
          {/* Top Left - Progress Bars */}
          <div className="feature-box dark-box progress-box">
            <div className="progress-item">
              <div className="progress-header">
                <span>1. WE MAKE IT EASY</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: '90%' }}></div>
              </div>
            </div>
            <div className="progress-item">
              <div className="progress-header">
                <span>2. BEST AUTO SERVICE</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div className="progress-item">
              <div className="progress-header">
                <span>3. REPLACEMENT SERVICE</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div className="progress-item">
              <div className="progress-header">
                <span>4. PROFESSIONAL CAR SERVICE</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: '95%' }}></div>
              </div>
            </div>
          </div>

          {/* Top Right - Image */}
          <div className="feature-box img-box">
            <img src="https://images.unsplash.com/photo-1503375806203-aa6a0d4bde29?auto=format&fit=crop&w=600&q=80" alt="Mechanic working on tire" />
          </div>

          {/* Bottom Left - Image */}
          <div className="feature-box img-box">
            <img src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=600&q=80" alt="Car interior" />
          </div>

          {/* Bottom Right - Priority Dark Box */}
          <div className="feature-box dark-box priority-box">
            <p className="section-tag"><span className="red-line">|</span> WHY CHOOSE US</p>
            <h2 className="priority-heading">Quality Work Is Our<br/>First Priority</h2>
            <div className="priority-checks">
              <div className="pc-item"><CheckCircleIcon className="check-icon-dark" /> GET A QUOTE</div>
              <div className="pc-item"><CheckCircleIcon className="check-icon-dark" /> BOOK APPOINTMENT</div>
              <div className="pc-item"><CheckCircleIcon className="check-icon-dark" /> GET YOUR CAR FIXED</div>
            </div>
            <button className="submit-button red-bg" onClick={() => navigate('/browse')}>GET A QUOTE</button>
          </div>

        </div>
      </section>

    </div>
  );
}

Component.displayName = "LandingPage";
