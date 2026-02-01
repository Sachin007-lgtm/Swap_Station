import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import ServiceStack from '../components/landing/ServiceStack';
import CallToAction from '../components/landing/CallToAction';
import Ecosystem from '../components/landing/Ecosystem';
import Footer from '../components/landing/Footer';
import '../components/landing/Landing.css';
import '../components/landing/LandingGlobal.css';

const LandingPage = () => {
    return (
        <div className="landing-page-wrapper">
            <Navbar />
            <Hero />
            <Features />
            <HowItWorks />
            <ServiceStack />
            <CallToAction />
            <Ecosystem />
            <Footer />
        </div>
    );
};

export default LandingPage;
