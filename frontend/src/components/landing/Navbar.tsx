import { useState, useEffect } from 'react';
import { Menu, X, BatteryCharging, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <motion.nav
            className={`navbar ${scrolled ? 'scrolled' : ''}`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="container navbar-container">
                <Link to="/" className="logo">
                    <BatteryCharging className="logo-icon" />
                    <span>Smart Swap <small className="text-muted-logo">AI-Powered Swap Network Ops</small></span>
                </Link>

                <div className={`nav-links ${isOpen ? 'open' : ''}`}>
                    <Link to="/" onClick={() => setIsOpen(false)}>HOME</Link>
                    <Link to="/auth" onClick={() => setIsOpen(false)}>DASHBOARD</Link>
                    <a href="#about" onClick={() => setIsOpen(false)}>ABOUT</a>
                    <a href="#services" onClick={() => setIsOpen(false)}>SERVICES</a>
                    <a href="#contact" onClick={() => setIsOpen(false)}>CONTACT</a>
                </div>

                <div className="nav-actions">
                    <Link to="/map" className="btn btn-outline btn-sm">
                        <MapPin size={14} /> FIND A STATION
                    </Link>
                    <Link to="/auth" className="btn btn-primary btn-sm">
                        GET STARTED <span style={{ marginLeft: '8px' }}>&gt;</span>
                    </Link>
                    <button className="menu-toggle" onClick={() => setIsOpen(!isOpen)}>
                        {isOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>
        </motion.nav>
    );
};

export default Navbar;
