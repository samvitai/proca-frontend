import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileCheck, 
  Calculator, 
  BookOpen, 
  TrendingUp,
  Building,
  Scale,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

const Services = () => {
  const serviceCategories = [
    {
      icon: FileCheck,
      title: "Audit & Assurance",
      description: "Comprehensive audit services to ensure accuracy and compliance",
      services: [
        "Statutory Audit",
        "Internal Audit", 
        "Tax Audit",
        "Stock Audit",
        "Management Audit",
        "Information Systems Audit",
        "Forensic Audit",
        "Due Diligence"
      ],
      features: ["Risk Assessment", "Compliance Review", "Financial Analysis", "Audit Reports"]
    },
    {
      icon: Calculator,
      title: "Taxation Services",
      description: "Complete tax planning, compliance and advisory services",
      services: [
        "Income Tax Planning",
        "GST Registration & Filing",
        "TDS/TCS Services",
        "Tax Audit & Assessment",
        "International Taxation",
        "Transfer Pricing",
        "Tax Litigation",
        "Tax Advisory"
      ],
      features: ["Tax Planning", "Return Filing", "Compliance Management", "Appeal Support"]
    },
    {
      icon: BookOpen,
      title: "Compliance & ROC",
      description: "Regulatory compliance and corporate law services",
      services: [
        "Company Incorporation", 
        "Annual ROC Filings",
        "Board Meeting Compliance",
        "Secretarial Services",
        "FEMA Compliance",
        "Labour Law Compliance",
        "Environmental Clearances",
        "Regulatory Advisory"
      ],
      features: ["Legal Compliance", "Documentation", "Filing Services", "Advisory Support"]
    },
    {
      icon: TrendingUp,
      title: "Business Advisory",
      description: "Strategic financial and business consultation services",
      services: [
        "Business Plan Preparation",
        "Financial Planning",
        "Investment Advisory",
        "Risk Management",
        "Business Valuation",
        "Merger & Acquisition",
        "Corporate Restructuring",
        "Management Consulting"
      ],
      features: ["Strategic Planning", "Financial Modeling", "Risk Analysis", "Growth Strategy"]
    },
    {
      icon: Building,
      title: "Corporate Services",
      description: "End-to-end corporate and legal services",
      services: [
        "Company Registration",
        "LLP Formation",
        "Partnership Deed",
        "Trademark Registration",
        "Import Export Code",
        "Digital Signature",
        "Corporate Banking",
        "Loan Documentation"
      ],
      features: ["Business Setup", "Legal Documentation", "Licensing", "Banking Support"]
    },
    {
      icon: Scale,
      title: "Specialized Services",
      description: "Industry-specific and specialized financial services",
      services: [
        "Project Finance",
        "Working Capital Management",
        "Cash Flow Management",
        "Budgeting & Forecasting",
        "Management Reporting",
        "Process Optimization",
        "ERP Implementation",
        "Financial Automation"
      ],
      features: ["Custom Solutions", "Industry Expertise", "Technology Integration", "Process Improvement"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-ca-primary to-ca-primary/80 text-ca-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="outline" className="mb-4 border-ca-primary-foreground text-ca-primary-foreground">
            Our Services
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Comprehensive CA Services
          </h1>
          <p className="text-xl text-ca-primary-foreground/90 max-w-3xl mx-auto leading-relaxed">
            From audit to advisory, we provide end-to-end chartered accounting services 
            tailored to meet your business needs and regulatory requirements.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {serviceCategories.map((category, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-card/50 backdrop-blur">
                <CardHeader className="pb-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-ca-accent/10 rounded-xl flex items-center justify-center group-hover:bg-ca-accent/20 transition-colors">
                      <category.icon className="h-8 w-8 text-ca-accent" />
                    </div>
                    <div className="flex-grow">
                      <CardTitle className="text-ca-primary text-xl mb-2">
                        {category.title}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {category.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Key Features */}
                  <div>
                    <h4 className="font-semibold text-ca-primary mb-3">Key Features</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {category.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-ca-accent mr-2 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Services List */}
                  <div>
                    <h4 className="font-semibold text-ca-primary mb-3">Our Services</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {category.services.map((service, serviceIndex) => (
                        <div key={serviceIndex} className="text-sm text-muted-foreground">
                          • {service}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-ca-primary mb-4">
              Our Service Process
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A streamlined approach to deliver exceptional results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Consultation", description: "Understanding your requirements and challenges" },
              { step: "02", title: "Planning", description: "Developing customized service strategy" },
              { step: "03", title: "Execution", description: "Implementing solutions with precision" },
              { step: "04", title: "Support", description: "Ongoing support and relationship management" }
            ].map((process, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-ca-accent rounded-full flex items-center justify-center mx-auto mb-4 text-ca-accent-foreground font-bold text-xl">
                  {process.step}
                </div>
                <h3 className="text-lg font-semibold text-ca-primary mb-2">{process.title}</h3>
                <p className="text-muted-foreground text-sm">{process.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-ca-primary text-ca-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Need Professional CA Services?
          </h2>
          <p className="text-lg text-ca-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Get in touch with our experts to discuss your requirements and 
            discover how we can help your business succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact"   onClick={() => window.scrollTo(0, 0)}
>
              <Button variant="ca-accent" size="lg">
                Contact Our Experts
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth/signin">
              <Button variant="outline" size="lg" className="border-ca-primary-foreground text-ca-primary hover:bg-slate-300">
                Client Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;