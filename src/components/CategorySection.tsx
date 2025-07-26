import { Card, CardContent } from "@/components/ui/card";
import { Pizza, Coffee, Wine, Utensils } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const iconMap: { [key: string]: any } = {
  "Fast Food": Pizza,
  "Fine Dining": Utensils,
  "Coffee & Cafes": Coffee,
  "Breweries": Wine,
  "default": Utensils
};

const colorMap: { [key: string]: string } = {
  "Fast Food": "bg-food-warm/10 text-food-warm",
  "Fine Dining": "bg-spice/10 text-spice", 
  "Coffee & Cafes": "bg-amber-500/10 text-amber-600",
  "Breweries": "bg-brewery-cool/10 text-brewery-cool",
  "default": "bg-primary/10 text-primary"
};

const CategorySection = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [vendorCounts, setVendorCounts] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true);
      
      if (data) {
        setCategories(data);
        
        // Fetch vendor counts for each category
        const counts: { [key: string]: number } = {};
        for (const category of data) {
          const { count } = await supabase
            .from('vendors')
            .select('*', { count: 'exact', head: true })
            .eq('category', category.name)
            .eq('is_active', true)
            .eq('approval_status', 'approved');
          
          counts[category.name] = count || 0;
        }
        setVendorCounts(counts);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryName: string) => {
    // Navigate to vendors filtered by category
    navigate(`/vendor/1?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <section id="categories" className="py-16 bg-gradient-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Browse by Category
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From quick bites to fine dining, discover your perfect meal from our diverse vendor network
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => {
            const IconComponent = iconMap[category.name] || iconMap.default;
            const colorClass = colorMap[category.name] || colorMap.default;
            const vendorCount = vendorCounts[category.name] || 0;
            
            return (
              <Card 
                key={category.id} 
                className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 cursor-pointer border-border/50"
                onClick={() => handleCategoryClick(category.name)}
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 rounded-full ${colorClass} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {category.description}
                  </p>
                  {vendorCount > 0 && (
                    <p className="text-sm font-medium text-primary">
                      {vendorCount} Vendor{vendorCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;