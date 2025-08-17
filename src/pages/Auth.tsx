
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isResetPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        
        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Password reset sent",
            description: "Check your email for password reset instructions",
          });
          setIsResetPassword(false);
        }
      } else if (isLogin) {
        const result = await signIn(email, password);
        if (!result.error) {
          toast({
            title: "Success",
            description: "Welcome back!",
          });
          // Redirect to dashboard for role-based routing
          window.location.href = '/dashboard';
        }
      } else {
        // Enhanced signup with role and phone
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
              phone: phone,
              role: role,
            }
          }
        });

        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Account created successfully! Please check your email to verify your account.",
          });
          
          // Redirect based on role
          if (role === 'vendor') {
            toast({
              title: "Vendor Registration",
              description: "After email verification, you can apply to become a vendor in your dashboard.",
            });
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        toast({
          title: "Google Auth Unavailable",
          description: "Google authentication is not configured. Please use email/password to sign in.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Google Auth Unavailable", 
        description: "Google authentication is not configured. Please use email/password to sign in.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            {isResetPassword ? 'Reset Password' : (isLogin ? 'Welcome Back' : 'Join SmartPortal')}
          </CardTitle>
          <CardDescription>
            {isResetPassword 
              ? 'Enter your email to receive password reset instructions'
              : isLogin 
                ? 'Sign in to your SmartPortal account' 
                : 'Create your account and start your journey'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Google OAuth Button */}
          {!isResetPassword && (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full mb-4"
                onClick={handleGoogleAuth}
                disabled={loading}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !isResetPassword && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  placeholder="Enter your full name"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            
            {!isResetPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  minLength={6}
                />
              </div>
            )}

            {!isLogin && !isResetPassword && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="space-y-3">
                  <Label>I want to join as: *</Label>
                  <RadioGroup value={role} onValueChange={setRole}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="customer" id="customer" />
                      <Label htmlFor="customer">Buyer/Customer</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="vendor" id="vendor" />
                      <Label htmlFor="vendor">Vendor/Restaurant Owner</Label>
                    </div>
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground">
                    {role === 'vendor' 
                      ? 'You can apply to become a vendor after registration.'
                      : 'Browse and order from amazing restaurants and vendors.'
                    }
                  </p>
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              variant="food"
            >
              {loading ? 'Processing...' : 
                isResetPassword ? 'Send Reset Email' :
                (isLogin ? 'Sign In' : 'Create Account')
              }
            </Button>
          </form>
          
          <div className="mt-6 text-center space-y-2">
            {!isResetPassword && (
              <>
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:underline block w-full"
                >
                  {isLogin 
                    ? "Don't have an account? Sign up" 
                    : 'Already have an account? Sign in'
                  }
                </button>
                
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setIsResetPassword(true)}
                    className="text-sm text-muted-foreground hover:text-primary hover:underline"
                  >
                    Forgot your password?
                  </button>
                )}
              </>
            )}
            
            {isResetPassword && (
              <button
                type="button"
                onClick={() => {
                  setIsResetPassword(false);
                  setIsLogin(true);
                }}
                className="text-primary hover:underline"
              >
                Back to sign in
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
