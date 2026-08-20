import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingWrapper } from "./OnboardingWrapper";
import { RecruiterPendingGate } from "./RecruiterPendingGate";
import { BottomNav } from "./layout/BottomNav";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <OnboardingWrapper>
      <RecruiterPendingGate>
        {/* Bottom padding keeps content clear of the fixed mobile bottom nav */}
        <div className="pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">{children}</div>
        <BottomNav />
      </RecruiterPendingGate>
    </OnboardingWrapper>
  );
};
