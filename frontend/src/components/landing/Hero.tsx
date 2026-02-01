import { useRef, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Hero.css';
import heroineBg from '../../assets/landing/hero-bg-2.jpg';

const Hero = () => {
    const heroRef = useRef<HTMLElement>(null);

    useEffect(() => {
        // Trigger entrance animations on load
        if (heroRef.current) {
            heroRef.current.classList.add('animate-active');
        }
    }, []);

    return (
        <section className="hero" id="home" style={{ backgroundImage: `url(${heroineBg})` }} ref={heroRef}>
            <div className="overlay"></div>
            <div className="container hero-container">
                <div className="hero-content">
                    <div className="badge-pill fade-in-scale">
                        <span className="badge-text">⚡LIVE AI OPERATIONS · REAL-TIME DECISIONING</span>
                    </div>

                    <h1 className="hero-title">
                        <span className="line-1 fade-in-up delay-1">Zero-Downtime <span className="text-gradient-energy">Energy</span></span><br />
                        <span className="line-2 fade-in-up delay-2">for <span className="text-gradient-commercial">Battery Swap Networks</span></span>
                    </h1>

                    <p className="hero-desc fade-in-blur delay-3">
                        Powering large-scale EV battery swap networks with AI-driven operations.
                        Predict congestion, reroute drivers, detect failures early, and keep stations running—without downtime.
                    </p>

                    <div className="hero-actions fade-in-up delay-4">
                        <Link to="/auth" className="btn btn-primary btn-lg btn-glow">
                            ENTER DASHBOARD
                        </Link>
                        <Link to="/map" className="btn btn-glass btn-lg">
                            VIEW LIVE NETWORK MAP <ArrowRight size={20} className="icon-right" />
                        </Link>
                    </div>

                    {/* Scroll indicator removed */}
                </div>
            </div>
        </section>
    );
};

export default Hero;
