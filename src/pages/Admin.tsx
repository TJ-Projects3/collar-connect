import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, MessageSquare, CalendarDays, Shield, Briefcase, Award, Medal, ShieldCheck, UserCheck, Flag } from "lucide-react";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ResourcesTab } from "@/components/admin/ResourcesTab";
import { PostsTab } from "@/components/admin/PostsTab";
import { EventsTab } from "@/components/admin/EventsTab";
import { JobsTab } from "@/components/admin/JobsTab";
import { ProjectAchievementsTab } from "@/components/admin/ProjectAchievementsTab";
import { EndorsementsTab } from "@/components/admin/EndorsementsTab";
import { IndustryVerificationTab } from "@/components/admin/IndustryVerificationTab";
import { RecruitersTab } from "@/components/admin/RecruitersTab";
import { ReportsTab } from "@/components/admin/ReportsTab";

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useAdminRole();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin panel.",
          variant: "destructive",
        });
        navigate("/feed");
      }
    }
  }, [user, isAdmin, authLoading, roleLoading, navigate, toast]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main Content */}
      <main className="container px-3 sm:px-4 py-6">
        <PageHeader
          title="Admin Dashboard"
          subtitle="Manage jobs, resources, events, reports, and verifications."
          icon={Shield}
          backTo="/feed"
          backLabel="Back to feed"
        />
        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList className="grid w-full max-w-6xl grid-cols-9">
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Jobs</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Resources</span>
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Posts</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Events</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Achievements</span>
            </TabsTrigger>
            <TabsTrigger value="endorsements" className="flex items-center gap-2">
              <Medal className="h-4 w-4" />
              <span className="hidden sm:inline">Endorsements</span>
            </TabsTrigger>
            <TabsTrigger value="recruiters" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Recruiters</span>
            </TabsTrigger>
            <TabsTrigger value="industry" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Industry</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs">
            <JobsTab />
          </TabsContent>

          <TabsContent value="resources">
            <ResourcesTab />
          </TabsContent>

          <TabsContent value="posts">
            <PostsTab />
          </TabsContent>

          <TabsContent value="events">
            <EventsTab />
          </TabsContent>

          <TabsContent value="achievements">
            <ProjectAchievementsTab />
          </TabsContent>

          <TabsContent value="endorsements">
            <EndorsementsTab />
          </TabsContent>

          <TabsContent value="recruiters">
            <RecruitersTab />
          </TabsContent>

          <TabsContent value="industry">
            <IndustryVerificationTab />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
