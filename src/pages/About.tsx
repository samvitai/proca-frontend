import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Award, 
  Target, 
  Heart,
  CheckCircle
} from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  const teamMembers = [
    {
      name: "CA Sethulekshmy S",
      qualification: "B.Com, FCA",
      role: "Partner and In-charge of HO at Bangalore"
    },
    {
      name: "CA Swaminathan K",
      qualification: "B.Com, FCA",
      role: "Partner and In-charge of Branch Office at Chennai"
    },
    {
      name: "Mr. Naga Raju P",
      qualification: "B.Com, FCA, DISA, LLB",
      role: "Legal Advisor"
    },
    {
      name: "Mr. Harish Kumar P",
      qualification: "BA, LLM",
      role: "Legal Advisor"
    },
    {
      name: "Mr. Saratchandran K Nair",
      qualification: "B.Com, CFE, CAMS",
      role: "Lead Investigator (Earlier worked as Inspector in CBI)"
    },
    {
      name: "Mr. Venugopal K G",
      qualification: "B.Com, CFE",
      role: "Lead Investigator (Earlier worked as DSP in CBI)"
    }
  ];

  const milestones = [
    { year: "2008", event: "Founded with a vision to transform CA services" },
    { year: "2012", event: "Expanded to serve 100+ clients across industries" },
    { year: "2016", event: "Launched digital audit and compliance solutions" },
    { year: "2020", event: "Achieved 500+ satisfied clients milestone" },
    { year: "2024", event: "Leading CA firm with comprehensive digital platform" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-ca-primary to-ca-primary/80 text-ca-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="outline" className="mb-4 border-ca-primary-foreground text-ca-primary-foreground">
            About Us
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Your Trusted Financial Partners
          </h1>
          <p className="text-xl text-ca-primary-foreground/90 max-w-3xl mx-auto leading-relaxed">
            With over 15 years of experience, NAGA & Associates has been providing exceptional 
            chartered accounting services to businesses of all sizes across India.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-ca-primary mb-6">
                Our Story
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                The firm established in the year 2010 by professionals who have vast experience in various domains like Corporate Finance, M&A, Due diligence, Secretarial Practices, Valuations & Investments, Corporate Taxation, International taxation, Financial Reporting, Management Information Systems, Enterprise Risk Management, Forensic Audits, Systems Audits, Process Audits, Statutory & Internal Audits etc. The partner’s dedication & constant efforts help to grow the firm.

The firm Headquarters located in Silicon Valley of India viz., Bangalore city and it has a branch in Chennai (Cultural Capital of South India) and network points in various parts of the country.
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                Today, we serve over 500 clients across various industries, from startups 
                to large corporations, providing them with comprehensive financial solutions 
                that drive growth and ensure compliance.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-ca-accent">500+</div>
                  <div className="text-sm text-muted-foreground">Happy Clients</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-ca-accent">15+</div>
                  <div className="text-sm text-muted-foreground">Years Experience</div>
                </div>
              </div>
            </div>
            <div className="bg-muted/30 rounded-2xl p-8 lg:p-12">
              <h3 className="text-xl font-semibold text-ca-primary mb-4">Our Mission</h3>
              <p className="text-muted-foreground mb-6">
                To empower businesses with accurate financial insights, ensure regulatory 
                compliance, and provide strategic guidance that fuels sustainable growth.
              </p>
              <h3 className="text-xl font-semibold text-ca-primary mb-4">Our Vision</h3>
              <p className="text-muted-foreground">
                To be India's most trusted and innovative chartered accounting firm, 
                known for excellence, integrity, and client success.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-ca-primary mb-4">
              Our Team
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our dedicated team comprises of competent people with extensive knowledge and experience. 
              Our professionalism and expertise helps us to service our clients to their satisfaction.
            </p>
          </div>

          {/* Partners */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-8">
            {teamMembers.slice(0, 2).map((member, index) => (
              <Card key={index} className="border-0 bg-card/50 backdrop-blur hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="w-16 h-16 bg-ca-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-ca-accent" />
                  </div>
                  <CardTitle className="text-ca-primary text-center text-xl">{member.name}</CardTitle>
                  <CardDescription className="text-center font-medium text-foreground/80">
                    {member.qualification}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Other Team Members */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.slice(2).map((member, index) => (
              <Card key={index} className="border-0 bg-card/50 backdrop-blur hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="w-16 h-16 bg-ca-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-ca-accent" />
                  </div>
                  <CardTitle className="text-ca-primary text-center text-xl">{member.name}</CardTitle>
                  <CardDescription className="text-center font-medium text-foreground/80">
                    {member.qualification}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-ca-primary mb-4">
              Our Journey
            </h2>
            <p className="text-lg text-muted-foreground">
              Key milestones in our growth story
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-start mb-8 last:mb-0">
                <div className="flex-shrink-0 w-16 h-16 bg-ca-accent rounded-full flex items-center justify-center text-ca-accent-foreground font-bold">
                  {milestone.year}
                </div>
                <div className="ml-6 flex-grow">
                  <div className="bg-card/50 rounded-lg p-6 border">
                    <p className="text-muted-foreground">{milestone.event}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-ca-primary text-ca-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Work Together?
          </h2>
          <p className="text-lg text-ca-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Let's discuss how our expertise can help your business achieve its financial goals.
          </p>
          <Link to="/contact"   onClick={() => window.scrollTo(0, 0)}
>
            <Button variant="ca-accent" size="lg">
              Get in Touch
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;