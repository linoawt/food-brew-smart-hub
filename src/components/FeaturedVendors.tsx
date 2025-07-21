import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, MapPin } from "lucide-react";

const vendors = [
  {
    id: 1,
    name: "Bella Italia",
    category: "Italian Cuisine",
    rating: 4.8,
    deliveryTime: "25-35 min",
    distance: "2.3 km",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b",
    badge: "Popular",
    badgeColor: "bg-food-warm"
  },
  {
    id: 2,
    name: "Craft & Barrel",
    category: "Brewery & Pub",
    rating: 4.9,
    deliveryTime: "30-40 min",
    distance: "1.8 km",
    image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e",
    badge: "New",
    badgeColor: "bg-secondary"
  },
  {
    id: 3,
    name: "Dragon Wok",
    category: "Asian Fusion",
    rating: 4.7,
    deliveryTime: "20-30 min",
    distance: "3.1 km",
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246",
    badge: "Fast Delivery",
    badgeColor: "bg-brewery-cool"
  }
];

const FeaturedVendors = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Featured Vendors
            </h2>
            <p className="text-xl text-muted-foreground">
              Top-rated establishments in your area
            </p>
          </div>
          <Button variant="outline" className="hidden md:flex">
            View All Vendors
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vendors.map((vendor) => (
            <Card 
              key={vendor.id} 
              className="group overflow-hidden hover:shadow-card transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={vendor.image} 
                  alt={vendor.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge className={`absolute top-4 left-4 ${vendor.badgeColor} text-white`}>
                  {vendor.badge}
                </Badge>
              </div>
              
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1">
                      {vendor.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {vendor.category}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-md">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium text-yellow-700">
                      {vendor.rating}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{vendor.deliveryTime}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{vendor.distance}</span>
                  </div>
                </div>
                
                <Button className="w-full" variant="outline">
                  View Menu
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedVendors;