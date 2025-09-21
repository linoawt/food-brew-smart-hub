
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, MapPin, Star, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatNaira } from '@/lib/utils';
import Header from '@/components/Header';

interface SearchResult {
  id: string;
  name: string;
  type: 'vendor' | 'product';
  description?: string;
  image_url?: string;
  category?: string;
  price?: number;
  rating?: number;
  delivery_time?: string;
  vendor_id?: string;
  vendor_name?: string;
}

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      // Search vendors
      const { data: vendors, error: vendorError } = await supabase
        .from('vendors')
        .select('id, name, description, image_url, category, rating, delivery_time')
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
        .eq('is_active', true)
        .limit(20);

      // Search products with vendor info
      const { data: products, error: productError } = await supabase
        .from('products')
        .select(`
          id, name, description, image_url, category, price, vendor_id,
          vendors(name)
        `)
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
        .eq('is_available', true)
        .limit(20);

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
          rating: vendor.rating,
          delivery_time: vendor.delivery_time,
        })),
        ...(products || []).map(product => ({
          id: product.id,
          name: product.name,
          type: 'product' as const,
          description: product.description,
          image_url: product.image_url,
          category: product.category,
          price: product.price,
          vendor_id: product.vendor_id,
          vendor_name: product.vendors?.name,
        })),
      ];

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Search Results</h1>
          <p className="text-muted-foreground">
            {results.length} result{results.length !== 1 ? 's' : ''} found for "{query}"
          </p>
        </div>

        {results.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground mb-4">
              Try searching with different keywords or browse our vendors directly.
            </p>
            <Link to="/vendors">
              <Button>Browse All Vendors</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result) => (
              <Card key={`${result.type}-${result.id}`} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{result.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {result.type === 'vendor' ? result.description : result.vendor_name}
                      </CardDescription>
                    </div>
                    <Badge variant={result.type === 'vendor' ? 'default' : 'secondary'}>
                      {result.type === 'vendor' ? 'Restaurant' : 'Food Item'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.category && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">Category:</span>
                        <span>{result.category}</span>
                      </div>
                    )}
                    
                    {result.type === 'vendor' ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm">{result.rating || 'New'}</span>
                        </div>
                        {result.delivery_time && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{result.delivery_time}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-primary">
                          {result.price ? formatNaira(result.price) : 'Price not available'}
                        </span>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{result.vendor_name}</span>
                        </div>
                      </div>
                    )}
                    
                    <Link to={result.type === 'vendor' ? `/vendor/${result.id}` : `/vendor/${result.vendor_id}`}>
                      <Button className="w-full">
                        {result.type === 'vendor' ? 'View Menu' : 'View Restaurant'}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
