import { BatteryCharging, Instagram, Twitter, Linkedin } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer" id="contact">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-brand">
                        <div className="logo footer-logo">
                            <BatteryCharging className="logo-icon" />
                            <span>Smart Swap</span>
                        </div>
                        <p>Empowering the electric revolution with instant energy solutions.</p>
                    </div>

                    <div className="footer-links">
                        <div>
                            <h4>Company</h4>
                            <ul>
                                <li><a href="#">About</a></li>
                                <li><a href="#">Careers</a></li>
                                <li><a href="#">Press</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4>Resources</h4>
                            <ul>
                                <li><a href="#">Blog</a></li>
                                <li><a href="#">Help Center</a></li>
                                <li><a href="#">Partners</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4>Follow Us</h4>
                            <div className="social-icons">
                                <a href="#"><Twitter size={20} /></a>
                                <a href="#"><Instagram size={20} /></a>
                                <a href="#"><Linkedin size={20} /></a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; 2026 Smart Swap Mobility. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
