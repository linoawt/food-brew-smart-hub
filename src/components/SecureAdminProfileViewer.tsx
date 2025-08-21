import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Eye, EyeOff, Search, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileData {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  role: string;
  created_at: string;
}

interface MaskedProfileData {
  id: string;
  user_id: string;
  full_name: string | null;
  email_masked: string | null;
  phone_masked: string | null;
  role: string;
  created_at: string;
}

const SecureAdminProfileViewer: React.FC = () => {
  const [searchUserId, setSearchUserId] = useState('');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [maskedData, setMaskedData] = useState<MaskedProfileData | null>(null);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  // Check if current user is admin
  if (profile?.role !== 'admin') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You do not have permission to access this feature.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const fetchMaskedProfile = async () => {
    if (!searchUserId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a user ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_profile_masked_data', {
        target_user_id: searchUserId.trim()
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setMaskedData(data[0]);
        setProfileData(null);
        setShowSensitiveData(false);
        toast({
          title: "Profile Found",
          description: "Masked profile data loaded successfully.",
        });
      } else {
        toast({
          title: "Not Found",
          description: "No profile found for this user ID.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSensitiveProfile = async () => {
    if (!searchUserId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a user ID",
        variant: "destructive",
      });
      return;
    }

    // Show additional warning for sensitive data access
    const confirmed = window.confirm(
      "⚠️ SECURITY WARNING ⚠️\n\n" +
      "You are about to access sensitive customer data including:\n" +
      "• Full email addresses\n" +
      "• Complete phone numbers\n" +
      "• Home addresses\n\n" +
      "This action will be logged and monitored.\n" +
      "Only proceed if you have a legitimate business need.\n\n" +
      "Do you want to continue?"
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_profile_sensitive_data', {
        target_user_id: searchUserId.trim()
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setProfileData(data[0]);
        setMaskedData(null);
        setShowSensitiveData(true);
        toast({
          title: "Sensitive Data Loaded",
          description: "⚠️ This access has been logged for security monitoring.",
          variant: "default",
        });
      } else {
        toast({
          title: "Not Found",
          description: "No profile found for this user ID.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Access Denied",
        description: error.message || "Failed to access sensitive data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearData = () => {
    setProfileData(null);
    setMaskedData(null);
    setShowSensitiveData(false);
    setSearchUserId('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <CardTitle>Secure Profile Viewer</CardTitle>
          </div>
          <CardDescription>
            Search and view customer profiles with enhanced security logging
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <div className="flex gap-2">
              <Input
                id="userId"
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
                placeholder="Enter user ID (UUID format)"
                className="flex-1"
              />
              <Button
                onClick={fetchMaskedProfile}
                disabled={loading}
                variant="outline"
              >
                <Search className="w-4 h-4 mr-2" />
                View Masked
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={fetchSensitiveProfile}
              disabled={loading}
              variant="destructive"
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Sensitive Data
            </Button>
            <Button
              onClick={clearData}
              variant="outline"
            >
              Clear
            </Button>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Security Notice:</strong> All profile access is logged and monitored. 
              Use "View Masked" for general inquiries. Only use "View Sensitive Data" when absolutely necessary.
            </p>
          </div>
        </CardContent>
      </Card>

      {(profileData || maskedData) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {showSensitiveData ? (
                  <>
                    <Eye className="w-5 h-5 text-destructive" />
                    Sensitive Profile Data
                  </>
                ) : (
                  <>
                    <EyeOff className="w-5 h-5 text-muted-foreground" />
                    Masked Profile Data
                  </>
                )}
              </CardTitle>
              <Badge variant={showSensitiveData ? "destructive" : "secondary"}>
                {showSensitiveData ? "SENSITIVE" : "MASKED"}
              </Badge>
            </div>
            {showSensitiveData && (
              <CardDescription className="text-destructive">
                ⚠️ This access has been logged for security monitoring
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Full Name</Label>
                <p className="text-sm">{(profileData || maskedData)?.full_name || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Role</Label>
                <Badge variant="outline">{(profileData || maskedData)?.role}</Badge>
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm font-mono">
                  {showSensitiveData 
                    ? (profileData?.email || 'N/A')
                    : (maskedData?.email_masked || 'N/A')
                  }
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Phone</Label>
                <p className="text-sm font-mono">
                  {showSensitiveData 
                    ? (profileData?.phone || 'N/A')
                    : (maskedData?.phone_masked || 'N/A')
                  }
                </p>
              </div>
              {showSensitiveData && profileData?.address && (
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium">Address</Label>
                  <p className="text-sm">{profileData.address}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm">
                  {new Date((profileData || maskedData)?.created_at || '').toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">User ID</Label>
                <p className="text-xs font-mono break-all">
                  {(profileData || maskedData)?.user_id}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SecureAdminProfileViewer;