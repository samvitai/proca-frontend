import HeroSection from "@/components/Landing/HeroSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileCheck, 
  Calculator, 
  BookOpen, 
  TrendingUp,
  CheckCircle,
  Star,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";

const Home = () => {
  const services = [
    {
      icon: FileCheck,
      title: "Audit & Assurance",
      description: "Statutory, Management, Information Security & Forensic Audit services",
      features: ["Statutory Audit", "Internal Audit", "Tax Audit", "Stock Audit"]
    },
    {
      icon: Calculator,
      title: "Taxation Services", 
      description: "Complete tax compliance and planning solutions",
      features: ["Income Tax", "GST Services", "TDS/TCS", "Tax Planning"]
    },
    {
      icon: BookOpen,
      title: "Compliance & Filing",
      description: "ROC filings, regulatory compliance and documentation",
      features: ["ROC Filing", "FEMA Compliance", "Annual Returns", "Board Resolutions"]
    },
    {
      icon: TrendingUp,
      title: "Business Advisory",
      description: "Strategic financial planning and business consultation",
      features: ["Financial Planning", "Business Setup", "Investment Advisory", "Risk Management"]
    }
  ];

  const achievements = [
    { number: "500+", label: "Satisfied Clients" },
    { number: "15+", label: "Years Experience" },
    { number: "50+", label: "Expert CAs" },
    { number: "98%", label: "Success Rate" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <HeroSection />

      {/* Services Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Our Services</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-ca-primary mb-4">
              Comprehensive CA Services
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From audit to advisory, we provide end-to-end chartered accounting 
              services to help your business thrive
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-card/50 backdrop-blur">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-ca-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-ca-accent/20 transition-colors">
                    <service.icon className="h-8 w-8 text-ca-accent" />
                  </div>
                  <CardTitle className="text-ca-primary">{service.title}</CardTitle>
                  <CardDescription className="text-sm">{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-ca-accent mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/services">
              <Button variant="ca-primary" size="lg">
                View All Services
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-20 bg-ca-primary text-ca-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by Businesses Nationwide
            </h2>
            <p className="text-ca-primary-foreground/80 text-lg">
              Our track record speaks for itself
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-ca-accent mb-2">
                  {achievement.number}
                </div>
                <div className="text-ca-primary-foreground/80">{achievement.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-ca-primary mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of businesses who trust us with their financial needs. 
            Let's discuss how we can help your business grow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact"   onClick={() => window.scrollTo(0, 0)}
>
              <Button variant="ca-accent" size="lg">
                Contact Us Today
              </Button>
            </Link>
            <Link to="/auth/signin">
              <Button variant="ca-outline" size="lg">
                Client Login
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Home;