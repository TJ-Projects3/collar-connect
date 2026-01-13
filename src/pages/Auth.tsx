import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import { useEffect } from "react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Sign in form state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign up form state
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);

  // Password reset state
  const [resetEmail, setResetEmail] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  // Password recovery mode (arriving from email link)
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      navigate("/feed");
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (signUpPassword !== signUpConfirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (signUpPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          data: {
            full_name: signUpName,
          },
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Account created!",
        description: "Welcome to NextGen Collar.",
      });
      navigate("/feed");
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description:
          error.message || "Unable to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Password reset email sent",
        description: "Check your email for password reset instructions.",
      });
      setShowResetForm(false);
      setResetEmail("");
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description:
          error.message || "Unable to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Detect Supabase password recovery and show new password form
  useEffect(() => {
    // Listen for auth state changes (Supabase sets event PASSWORD_RECOVERY)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryMode(true);
        setShowResetForm(false);
      }
    });

    // Handle PKCE code exchange (modern Supabase flow)
    const handleCodeExchange = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Code exchange error:', error);
          }
          // Clean up URL after exchange
          window.history.replaceState({}, '', window.location.pathname);
        } catch (err) {
          console.error('Exchange failed:', err);
        }
      }
    };

    handleCodeExchange();

    // Fallback: check URL hash for type=recovery
    try {
      const hash = window.location.hash || "";
      if (hash.includes("type=recovery")) {
        setIsRecoveryMode(true);
        setShowResetForm(false);
      }
    } catch {}

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast({
        title: "Password updated",
        description: "Your password has been reset successfully.",
      });
      // Exit recovery mode and go to feed
      setIsRecoveryMode(false);
      setNewPassword("");
      setConfirmNewPassword("");
      // Optional: clean hash to avoid re-triggering
      try {
        history.replaceState(null, document.title, window.location.pathname + window.location.search);
      } catch {}
      navigate("/feed");
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Unable to update password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <nav className="container mx-auto px-4 py-4">
          <h1
            className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent cursor-pointer inline-block"
            onClick={() => navigate("/")}
          >
            NextGen Collar
          </h1>
        </nav>
      </header>

      {/* Auth Form */}
      <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Join NextGen Collar</CardTitle>
            <CardDescription>
              Connect with the next generation of tech professionals
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isRecoveryMode ? (
              <div className="space-y-4">
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showSignUpPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 px-3 text-muted-foreground"
                        onClick={() => setShowSignUpPassword((prev) => !prev)}
                        aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                      >
                        {showSignUpPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-new-password"
                        type={showSignUpConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                        minLength={8}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 px-3 text-muted-foreground"
                        onClick={() => setShowSignUpConfirmPassword((prev) => !prev)}
                        aria-label={showSignUpConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showSignUpConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setIsRecoveryMode(false);
                        setNewPassword("");
                        setConfirmNewPassword("");
                      }}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isLoading}>
                      {isLoading ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </form>
              </div>
            ) : showResetForm ? (
              <div className="space-y-4">
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowResetForm(false);
                        setResetEmail("");
                      }}
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isLoading}
                    >
                      {isLoading ? "Sending..." : "Send Reset Link"}
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={showSignInPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={signInPassword}
                          onChange={(e) => setSignInPassword(e.target.value)}
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 px-3 text-muted-foreground"
                          onClick={() => setShowSignInPassword((prev) => !prev)}
                          aria-label={showSignInPassword ? "Hide password" : "Show password"}
                        >
                          {showSignInPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 text-sm"
                      onClick={() => setShowResetForm(true)}
                    >
                      Forgot password?
                    </Button>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Jane Smith"
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showSignUpPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          required
                          minLength={8}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 px-3 text-muted-foreground"
                          onClick={() => setShowSignUpPassword((prev) => !prev)}
                          aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                        >
                          {showSignUpPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-confirm"
                          type={showSignUpConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={signUpConfirmPassword}
                          onChange={(e) =>
                            setSignUpConfirmPassword(e.target.value)
                          }
                          required
                          minLength={8}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 px-3 text-muted-foreground"
                          onClick={() =>
                            setShowSignUpConfirmPassword((prev) => !prev)
                          }
                          aria-label={
                            showSignUpConfirmPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showSignUpConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground text-center">
              By continuing, you agree to NextGen Collar's Terms of Service and
              Privacy Policy
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
