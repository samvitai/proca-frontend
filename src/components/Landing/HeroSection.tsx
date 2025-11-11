import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/ca-hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-ca-primary/80"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Excellence in 
            <span className="text-ca-accent"> Delivery</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
            Professional audit, taxation, and business advisory services 
            tailored for your success
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/contact">
              <Button variant="hero" size="lg" className="group">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/services">
              <Button variant="ca-outline" size="lg" className="border-white text-white hover:bg-white hover:text-ca-primary">
                Our Services
              </Button>
            </Link>
          </div>

          {/* Key Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
            <div className="flex flex-col items-center p-6 bg-white/10 backdrop-blur rounded-xl">
              <Shield className="h-12 w-12 text-ca-accent mb-4" />
              <h3 className="text-lg font-semibold mb-2">Trusted Expertise</h3>
              <p className="text-sm text-white/80">Professional chartered accountants with years of experience</p>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-white/10 backdrop-blur rounded-xl">
              <TrendingUp className="h-12 w-12 text-ca-accent mb-4" />
              <h3 className="text-lg font-semibold mb-2">Growth Focused</h3>
              <p className="text-sm text-white/80">Strategic financial planning for business growth</p>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-white/10 backdrop-blur rounded-xl">
              <Users className="h-12 w-12 text-ca-accent mb-4" />
              <h3 className="text-lg font-semibold mb-2">Client Centric</h3>
              <p className="text-sm text-white/80">Personalized service and dedicated support</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;