import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-ca-primary text-ca-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-ca-accent rounded-lg flex items-center justify-center">
                <span className="text-ca-accent-foreground font-bold text-xl">NA</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">NAGA & Associates</h3>
                <p className="text-sm text-ca-primary-foreground/80">Chartered Accountants</p>
              </div>
            </div>
            <p className="text-ca-primary-foreground/80 mb-4 max-w-md">
              Professional chartered accounting services with expertise in audit, taxation, 
              compliance, and business advisory. Your trusted financial partners.
            </p>

          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-ca-accent transition-colors">About Us</Link></li>
              <li><Link to="/services" className="hover:text-ca-accent transition-colors">Services</Link></li>
              <li><Link to="/contact" className="hover:text-ca-accent transition-colors">Contact</Link></li>
              <li><Link to="/auth/signin" className="hover:text-ca-accent transition-colors">Client Portal</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4">Terms & Conditions</h4>
            <div className="space-y-2 text-sm text-ca-primary-foreground/80">
              <div className="flex items-center space-x-2">
              <p>
    <a
      href="/4. Terms & Conditions- Online Order Making.pdf"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-ca-accent transition-colors"
    >
Terms & Conditions- Online Order Making    </a>
  </p>

              </div>
              <div className="flex items-center space-x-2">
              <p>
    <a
      href="/5. Online Order Cancellation & Refund.pdf"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-ca-accent transition-colors"
    >
Online Order Cancellation & Refund    </a>
  </p>
              </div>
              <div className="flex items-center space-x-2">
              <p>
    <a
      href="/6. Terms & Conditions- General & Registration.pdf"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-ca-accent transition-colors"
    >
Terms & Conditions- General & Registration    </a>
  </p>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact Info</h4>
            <div className="space-y-2 text-sm text-ca-primary-foreground/80">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+91  97422 99168</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>info@nacas.biz</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Bengaluru,Karnataka</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-ca-primary-foreground/20 mt-8 pt-8 text-center">
          <p className="text-sm text-ca-primary-foreground/60">
            © 2025 NAGA & Associates. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;