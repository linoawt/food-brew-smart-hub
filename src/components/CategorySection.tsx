import { Card, CardContent } from "@/components/ui/card";
import { Pizza, Coffee, Wine, Utensils } from "lucide-react";
import { useNavigate } from "react-router-dom";

const categories = [
  {
    id: 1,
    name: "Fast Food",
    icon: Pizza,
    count: "45+ Vendors",
    color: "bg-food-warm/10 text-food-warm",
    description: "Burgers, Pizza, Sandwiches"
  },
  {
    id: 2,
    name: "Fine Dining",
    icon: Utensils,
    count: "28+ Vendors",
    color: "bg-spice/10 text-spice",
    description: "Gourmet, Steaks, Seafood"
  },
  {
    id: 3,
    name: "Coffee & Cafes",
    icon: Coffee,
    count: "60+ Vendors",
    color: "bg-amber-500/10 text-amber-600",
    description: "Coffee, Pastries, Light Bites"
  },
  {
    id: 4,
    name: "Breweries",
    icon: Wine,
    count: "32+ Vendors",
    color: "bg-brewery-cool/10 text-brewery-cool",
    description: "Craft Beer, Wine, Spirits"
  }
];

const CategorySection = () => {
  const navigate = useNavigate();

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
          {categories.map((category) => (
            <Card 
              key={category.id} 
              className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 cursor-pointer border-border/50"
              onClick={() => handleCategoryClick(category.name)}
            >
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 rounded-full ${category.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <category.icon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {category.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {category.description}
                </p>
                <p className="text-sm font-medium text-primary">
                  {category.count}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;