import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Clock, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-food-brewery.jpg";

const Hero = () => {
  const navigate = useNavigate();

  const handleOrderNow = () => {
    // Navigate to vendors list
    navigate('/vendors');
  };

  const handleBrowseMenu = () => {
    // Scroll to category section or navigate to vendors
    const categorySection = document.getElementById('categories');
    if (categorySection) {
      categorySection.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/vendors');
    }
  };

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(24, 85, 55, 0.7), rgba(0, 0, 0, 0.4)), url(${heroImage})`
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Savor Every
            <span className="bg-gradient-to-r from-orange-400 to-yellow-300 bg-clip-text text-transparent block">
              Moment
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            Discover exceptional food and craft beverages from the finest local vendors. 
            Fresh ingredients, bold flavors, unforgettable experiences.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              variant="hero" 
              size="lg" 
              className="text-lg px-8 py-4"
              onClick={handleOrderNow}
            >
              Order Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-lg px-8 py-4"
              onClick={handleBrowseMenu}
            >
              Browse Menu
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-lg px-8 py-4"
              onClick={() => navigate('/auth')}
            >
              Get Started
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="w-6 h-6 text-yellow-400 mr-1" />
                <span className="text-2xl font-bold text-white">4.8</span>
              </div>
              <p className="text-white/80 text-sm">Customer Rating</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-6 h-6 text-green-400 mr-1" />
                <span className="text-2xl font-bold text-white">25</span>
              </div>
              <p className="text-white/80 text-sm">Avg Delivery (min)</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Truck className="w-6 h-6 text-blue-400 mr-1" />
                <span className="text-2xl font-bold text-white">200+</span>
              </div>
              <p className="text-white/80 text-sm">Partner Vendors</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-orange-400/20 rounded-full animate-float" />
      <div className="absolute bottom-20 right-10 w-16 h-16 bg-green-400/20 rounded-full animate-float" style={{animationDelay: "1s"}} />
    </section>
  );
};

export default Hero;