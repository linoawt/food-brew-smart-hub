import { ShoppingCart, Search, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Header = () => {
  return (
    <header className="bg-card shadow-card sticky top-0 z-50 backdrop-blur-sm bg-card/90">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-hero rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">SP</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">SmartPortal</h1>
              <p className="text-xs text-muted-foreground">Food & Brewery Hub</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search for food, drinks, or vendors..." 
                className="pl-10 pr-4 bg-muted/50 border-border focus:bg-background transition-colors"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <MapPin className="w-4 h-4" />
              <span className="text-sm hidden md:block">Delivery</span>
            </div>
            
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </Button>
            
            <Button variant="outline" size="sm" className="hidden md:flex">
              <User className="w-4 h-4 mr-1" />
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;