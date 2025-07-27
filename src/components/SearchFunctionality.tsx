
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SearchResult {
  id: string;
  name: string;
  type: 'vendor' | 'product';
  description?: string;
  image_url?: string;
  category?: string;
}

interface SearchFunctionalityProps {
  onSearchResults?: (results: SearchResult[]) => void;
  className?: string;
}

const SearchFunctionality = ({ onSearchResults, className }: SearchFunctionalityProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const search = async (query: string) => {
    if (!query.trim()) {
      toast({
        title: "Search Error",
        description: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      // Search vendors
      const { data: vendors, error: vendorError } = await supabase
        .from('vendors')
        .select('id, name, description, image_url, category')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(10);

      // Search products
      const { data: products, error: productError } = await supabase
        .from('products')
        .select('id, name, description, image_url, category')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .eq('is_available', true)
        .limit(10);

      if (vendorError || productError) {
        throw new Error('Search failed');
      }

      // Combine and format results
      const searchResults: SearchResult[] = [
        ...(vendors || []).map(vendor => ({
          id: vendor.id,
          name: vendor.name,
          type: 'vendor' as const,
          description: vendor.description,
          image_url: vendor.image_url,
          category: vendor.category,
        })),
        ...(products || []).map(product => ({
          id: product.id,
          name: product.name,
          type: 'product' as const,
          description: product.description,
          image_url: product.image_url,
          category: product.category,
        })),
      ];

      // Call callback if provided
      if (onSearchResults) {
        onSearchResults(searchResults);
      }

      // Navigate to search results page with query
      navigate(`/search?q=${encodeURIComponent(query)}`);

      toast({
        title: "Search Complete",
        description: `Found ${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`,
      });

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Something went wrong while searching. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(searchTerm);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      search(searchTerm);
    }
  };

  return (
    <form onSubmit={handleSearch} className={`flex ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input 
          placeholder="Search for food, drinks, or vendors..." 
          className="pl-10 pr-4 bg-muted/50 border-border focus:bg-background transition-colors rounded-r-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
        />
      </div>
      <Button 
        type="submit"
        variant="outline" 
        className="rounded-l-none border-l-0"
        disabled={isSearching}
      >
        {isSearching ? (
          <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
        ) : (
          <Search className="w-4 h-4" />
        )}
      </Button>
    </form>
  );
};

export default SearchFunctionality;
