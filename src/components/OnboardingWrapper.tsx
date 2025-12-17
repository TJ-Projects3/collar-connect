import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, isProfileComplete } from "@/hooks/useProfile";
import { OnboardingModal } from "./OnboardingModal";
import { Loader2 } from "lucide-react";

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

export const OnboardingWrapper = ({ children }: OnboardingWrapperProps) => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading, refetch } = useProfile();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    // Only check after auth and profile are loaded
    if (!authLoading && !profileLoading && user) {
      const needsOnboarding = !isProfileComplete(profile);
      setShowOnboarding(needsOnboarding && !onboardingComplete);
    }
  }, [authLoading, profileLoading, user, profile, onboardingComplete]);

  const handleOnboardingComplete = () => {
    setOnboardingComplete(true);
    setShowOnboarding(false);
    refetch();
  };

  // Show loading while checking auth/profile status
  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <OnboardingModal
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </>
  );
};
