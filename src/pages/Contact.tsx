import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
  Send,
  CheckCircle
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "@/hooks/use-toast";
import { showFieldError } from "@/lib/validation-toast";
import { useFormValidation, CommonValidationRules } from "@/hooks/useFormValidation";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    message: ''
  });

  // Form validation setup
  const validationRules = {
    name: CommonValidationRules.required,
    email: CommonValidationRules.email,
    message: CommonValidationRules.required,
    phone: CommonValidationRules.optionalPhone,
  };

  const { errors, validateAll, clearError } = useFormValidation(validationRules);

  // Check if all required fields are filled and valid
  const isFormValid = useMemo(() => {
    const requiredFields = ['name', 'email', 'message'];
    const hasAllRequiredFields = requiredFields.every(field => formData[field as keyof typeof formData]?.toString().trim());
    const hasValidationErrors = Object.keys(errors).length > 0;
    return hasAllRequiredFields && !hasValidationErrors;
  }, [formData, errors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    if (!validateAll(formData)) {
      const firstError = Object.entries(errors)[0];
      if (firstError) {
        showFieldError(firstError[0], firstError[1]);
      }
      return;
    }

    try {
      // TODO: Backend API call
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });

      // Simulate successful submission
      toast({
        title: "Success!",
        description: "Your message has been sent. We'll get back to you soon.",
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        service: '',
        message: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearError(field);
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Phone",
      details: "+91 97422 99168",
      
    },
    {
      icon: Mail,
      title: "Email",
      details: "info@nacas.biz",
      
    },
    {
      icon: MapPin,
      title: "Head Office",
      details: "#36/4, 2nd Floor, Somasundarapalya, 27th Main, Sector-2, HSR Layout, Bengaluru - 560102, Karnataka",
      
    },
    {
      icon: MapPin,
      title: "Branch Office",
      details:"#1, Jeyendra Apartents, 15, Jagadeeswaran St., T.Nagar, Chennai - 600017, Tamilnadu",
    }
  ];

  const services = [
    "Audit & Assurance",
    "Taxation Services", 
    "Compliance & ROC",
    "Business Advisory",
    "Corporate Services",
    "Other Services"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-ca-primary to-ca-primary/80 text-ca-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="outline" className="mb-4 border-ca-primary-foreground text-ca-primary-foreground">
            Contact Us
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Get in Touch
          </h1>
          <p className="text-xl text-ca-primary-foreground/90 max-w-3xl mx-auto leading-relaxed">
            Ready to take your business to the next level? Contact our expert team 
            for professional chartered accounting services.
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="border-0 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-ca-primary text-2xl">Send us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you as soon as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Your full name"
                          required
                          className={errors.name ? "border-red-500" : ""}
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500">{errors.name}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="your.email@example.com"
                          required
                          className={errors.email ? "border-red-500" : ""}
                        />
                        {errors.email && (
                          <p className="text-sm text-red-500">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+91 98765 43210"
                          className={errors.phone ? "border-red-500" : ""}
                        />
                        {errors.phone && (
                          <p className="text-sm text-red-500">{errors.phone}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Company Name</Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          placeholder="Your company name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="service">Service Required</Label>
                      <select
                        id="service"
                        value={formData.service}
                        onChange={(e) => handleInputChange('service', e.target.value)}
                        className="w-full p-2 border border-input rounded-md bg-background"
                      >
                        <option value="">Select a service</option>
                        {services.map((service) => (
                          <option key={service} value={service}>{service}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        placeholder="Please describe your requirements..."
                        rows={5}
                        required
                        className={errors.message ? "border-red-500" : ""}
                      />
                      {errors.message && (
                        <p className="text-sm text-red-500">{errors.message}</p>
                      )}
                    </div>

                    <Button type="submit" disabled={!isFormValid} variant="ca-accent" size="lg" className="w-full md:w-auto">
                      Send Message
                      <Send className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <Card key={index} className="border-0 bg-card/50 backdrop-blur">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-14 h-12 bg-ca-accent/10 rounded-lg flex items-center justify-center">
                        <info.icon className="h-6 w-14 text-ca-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-ca-primary mb-1 ">{info.title}</h3>
                        <p className="text-foreground font-medium">{info.details}</p>
                    
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Quick Contact Card */}
              <Card className="border-0 bg-ca-primary text-ca-primary-foreground">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold mb-2">Need Immediate Assistance?</h3>
                  <p className="text-ca-primary-foreground/80 text-sm mb-4">
                    Call us directly for urgent matters
                  </p>
                  <Button variant="ca-accent" size="sm" className="w-full">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Now
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-ca-primary mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Quick answers to common questions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                question: "What services do you provide?",
                answer: "We offer comprehensive CA services including audit, taxation, compliance, and business advisory services."
              },
              {
                question: "How do I get started?", 
                answer: "Simply fill out our contact form or call us directly. We'll schedule a consultation to understand your needs."
              },
              {
                question: "What are your fees?",
                answer: "Our fees vary based on the scope of work. We provide transparent pricing after understanding your requirements."
              },
              {
                question: "Do you work with small businesses?",
                answer: "Yes, we work with businesses of all sizes, from startups to large corporations across various industries."
              }
            ].map((faq, index) => (
              <Card key={index} className="border-0 bg-card/50 backdrop-blur">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <CheckCircle className="h-6 w-6 text-ca-accent flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-ca-primary mb-2">{faq.question}</h3>
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;