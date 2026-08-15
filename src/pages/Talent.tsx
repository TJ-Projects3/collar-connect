import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal, Users, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { TalentFilters } from "@/components/talent/TalentFilters";
import { CandidateCard } from "@/components/talent/CandidateCard";
import {
  EMPTY_FILTERS,
  filterCandidates,
  useTalentCandidates,
  useTalentFilterOptions,
  availabilityLabel,
  type TalentFilterState,
} from "@/hooks/useTalentCandidates";
import { useTalentQuota } from "@/hooks/useTalentAccess";
import { talentAccessLevel } from "@/lib/profile-display";

const Talent = () => {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [filters, setFilters] = useState<TalentFilterState>(EMPTY_FILTERS);

  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user!.id,
        _role: "admin",
      });
      if (error) throw error;
      return data === true;
    },
  });

  const accessLevel = talentAccessLevel(profile, isAdmin === true);
  const scoped = accessLevel === "scoped";

  const { data: candidates, isLoading } = useTalentCandidates(accessLevel);
  const { data: quota } = useTalentQuota(scoped);
  const options = useTalentFilterOptions(candidates);
  const results = useMemo(() => filterCandidates(candidates, filters), [candidates, filters]);

  useEffect(() => {
    document.title = "Talent Discovery | NextGen Collar";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        "content",
        "Discover student tech talent by skill, university, graduation year, and availability, then message candidates directly."
      );
    }
  }, []);

  if (profileLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-6 max-w-7xl space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (accessLevel === "none") return <Navigate to="/feed" replace />;

  type ChipKey = "techStack" | "gradYears" | "universities" | "availability";

  const activeChips: { key: ChipKey; value: string; label: string }[] = [
    ...filters.techStack.map((v) => ({ key: "techStack" as const, value: v, label: v })),
    ...filters.gradYears.map((v) => ({ key: "gradYears" as const, value: v, label: `Class of ${v}` })),
    ...filters.universities.map((v) => ({ key: "universities" as const, value: v, label: v })),
    ...filters.availability.map((v) => ({
      key: "availability" as const,
      value: v,
      label: availabilityLabel(v) || v,
    })),
  ];

  const removeChip = (key: ChipKey, value: string) =>
    setFilters({ ...filters, [key]: filters[key].filter((v) => v !== value) });

  const filterPanel = (
    <TalentFilters
      filters={filters}
      options={options}
      onChange={setFilters}
      onClear={() => setFilters(EMPTY_FILTERS)}
    />
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Candidate Discovery</h1>
          <p className="text-muted-foreground mt-1">
            Find student talent by tech stack, school, graduation year, and availability.
          </p>

          {scoped && (
            <Card className="mt-4 border-secondary/40 bg-secondary/5">
              <CardContent className="p-4 text-sm space-y-1">
                <p className="font-semibold">Industry access</p>
                <p className="text-muted-foreground">
                  You're browsing students who opted into industry visibility. Resumes and contact
                  details stay recruiter-only, and you can send intro requests instead of direct
                  messages.
                </p>
                {quota && !quota.uncapped && (
                  <p className="text-muted-foreground">
                    Today: {quota.views_used ?? 0}/{quota.views_limit ?? 60} profile views ·{" "}
                    {quota.contacts_used ?? 0}/{quota.contacts_limit ?? 15} intro requests
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </header>

        <div className="flex gap-6">
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <Card className="sticky top-20">
              <CardContent className="p-5">{filterPanel}</CardContent>
            </Card>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                {isLoading ? "Loading candidates..." : `${results.length} candidate${results.length === 1 ? "" : "s"}`}
              </p>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {activeChips.length > 0 && (
                      <Badge variant="secondary" className="ml-1">{activeChips.length}</Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto">
                  <div className="pt-6">{filterPanel}</div>
                </SheetContent>
              </Sheet>
            </div>

            {activeChips.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {activeChips.map((chip) => (
                  <Badge
                    key={`${chip.key}-${chip.value}`}
                    variant="secondary"
                    className="gap-1 cursor-pointer"
                    onClick={() => removeChip(chip.key, chip.value)}
                  >
                    {chip.label}
                    <X className="h-3 w-3" />
                  </Badge>
                ))}
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-5 space-y-4">
                      <div className="flex gap-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-9 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : results.length === 0 ? (
              <Card>
                <CardContent className="p-10 text-center space-y-3">
                  <Users className="h-8 w-8 mx-auto text-muted-foreground" />
                  <h2 className="font-semibold">No candidates match these filters</h2>
                  <p className="text-sm text-muted-foreground">
                    Try removing a filter or broadening your search.
                  </p>
                  {activeChips.length > 0 && (
                    <Button variant="outline" onClick={() => setFilters(EMPTY_FILTERS)}>
                      Clear filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {results.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    accessLevel={accessLevel}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Talent;
