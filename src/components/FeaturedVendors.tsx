import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Vendor {
  id: string;
  name: string;
  description: string;
  image_url: string;
  category: string;
  rating: number;
  delivery_time: string;
  delivery_fee: number;
}

const FeaturedVendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const { data, error } = await supabase
          .from('vendors')
          .select('*')
          .eq('is_active', true)
          .limit(4);

        if (error) throw error;
        setVendors(data || []);
      } catch (error) {
        console.error('Error fetching vendors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-primary mb-4">
            Featured Restaurants & Breweries
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover the best local restaurants and craft breweries in your area.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {vendors.map((vendor) => (
            <Card key={vendor.id} className="group hover:shadow-elegant transition-all duration-300 hover:scale-105">
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <img
                  src={vendor.image_url}
                  alt={vendor.name}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-warning text-warning" />
                    <span className="text-xs font-medium">{vendor.rating}</span>
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">{vendor.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{vendor.description}</p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{vendor.delivery_time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    <span>${vendor.delivery_fee} delivery</span>
                  </div>
                </div>
                
                <Link to={`/vendor/${vendor.id}`}>
                  <Button variant="food" className="w-full">
                    Order Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedVendors;