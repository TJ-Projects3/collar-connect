import { useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Loader2, UserPlus } from "lucide-react";
import { useAllProfiles } from "@/hooks/useAllProfiles";

const MyNetwork = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: profiles, isLoading } = useAllProfiles();

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!profiles) return [];

    return profiles.filter((user) => {
      const matchesSearch =
        searchQuery === "" ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.location?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [profiles, searchQuery]);

  // Get initials from full name for avatar fallback
  const getInitials = (name: string | null) => {
    if (!name) return "??";
    const names = name.trim().split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Network</h1>
          <p className="text-muted-foreground">
            Connect with diverse professionals in the tech industry
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search people by name, headline, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Results count */}
        {!isLoading && (
          <p className="text-sm text-muted-foreground mb-4">
            {filteredUsers.length} professional{filteredUsers.length !== 1 ? "s" : ""} found
          </p>
        )}

        {/* User Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.map((user) => (
              <Card
                key={user.id}
                className="hover:shadow-lg transition-all duration-300 rounded-xl border-border/50"
              >
                <CardHeader className="space-y-4 pb-4">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-3">
                      <AvatarImage src={user.avatar_url || undefined} alt={user.full_name} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-lg leading-tight mb-1">
                      {user.full_name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                      {user.job_title || "Tech Professional"}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {user.location && (
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{user.location}</span>
                    </div>
                  )}
                  <Button className="w-full" variant="outline">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery
                ? "No professionals match your search. Try different keywords."
                : "No professionals available yet."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyNetwork;
