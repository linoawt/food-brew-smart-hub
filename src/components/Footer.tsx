import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Footer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const handleSocialClick = (platform: string) => {
    toast({
      title: "External Link",
      description: `Opening ${platform} in a new tab...`,
    });
    // In a real app, these would be actual social media URLs
    window.open(`https://${platform.toLowerCase()}.com`, '_blank');
  };

  const handleNewsletterSubscribe = () => {
    if (email.trim()) {
      toast({
        title: "Subscribed!",
        description: "Thanks for subscribing to our newsletter.",
      });
      setEmail("");
    } else {
      toast({
        title: "Email required",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
    }
  };

  const handleQuickLinkClick = (link: string) => {
    switch (link) {
      case 'Browse Vendors':
        navigate('/vendor/1');
        break;
      case 'Order Tracking':
        navigate('/my-dashboard');
        break;
      case 'About Us':
      case 'Help Center':
      case 'Contact':
        toast({
          title: "Coming Soon",
          description: `${link} page is under development.`,
        });
        break;
      default:
        break;
    }
  };

  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-hero rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">SP</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">SmartPortal</h3>
                <p className="text-sm text-muted-foreground">Food & Brewery Hub</p>
              </div>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md">
              Your gateway to exceptional food and beverages. Connecting you with the finest local vendors 
              for fresh ingredients, bold flavors, and unforgettable dining experiences.
            </p>
            <div className="flex space-x-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="bg-muted hover:bg-muted/80"
                onClick={() => handleSocialClick("Facebook")}
              >
                <Facebook className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="bg-muted hover:bg-muted/80"
                onClick={() => handleSocialClick("Twitter")}
              >
                <Twitter className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="bg-muted hover:bg-muted/80"
                onClick={() => handleSocialClick("Instagram")}
              >
                <Instagram className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => handleQuickLinkClick('Browse Vendors')}
                  className="text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  Browse Vendors
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleQuickLinkClick('Order Tracking')}
                  className="text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  Order Tracking
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleQuickLinkClick('About Us')}
                  className="text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  About Us
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleQuickLinkClick('Help Center')}
                  className="text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  Help Center
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleQuickLinkClick('Contact')}
                  className="text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="text-sm">hello@smartportal.com</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">123 Food Street, City</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Newsletter */}
        <div className="border-t border-border pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h4 className="font-semibold text-foreground mb-1">Stay Updated</h4>
              <p className="text-sm text-muted-foreground">Get the latest offers and updates</p>
            </div>
            <div className="flex space-x-2 w-full md:w-auto">
              <Input 
                placeholder="Enter your email" 
                className="md:w-64"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleNewsletterSubscribe()}
              />
              <Button variant="default" onClick={handleNewsletterSubscribe}>
                Subscribe
              </Button>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-border pt-6 mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 SmartPortal. All rights reserved. | Privacy Policy | Terms of Service
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;