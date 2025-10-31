import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Users, Target, TrendingUp, Award } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            NextGen Collar
          </h1>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button onClick={() => navigate("/auth")}>
              Join Now
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <div className="inline-block">
              <h2 className="text-5xl md:text-6xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  NextGen Collar
                </span>
              </h2>
            </div>
            <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto">
              Championing diversity and inclusion for the next generation of the technology sector
            </p>
            <div className="flex gap-4 justify-center pt-6">
              <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
                Get Started
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-lg px-8">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Building an Inclusive Future
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're creating a professional network that celebrates diversity, fosters inclusion, 
              and empowers the next generation of tech leaders.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Diverse Community</h4>
              <p className="text-sm text-muted-foreground">
                Connect with professionals from all backgrounds and experiences
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                <Target className="w-7 h-7 text-secondary" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Inclusive Opportunities</h4>
              <p className="text-sm text-muted-foreground">
                Discover career opportunities that value diversity and inclusion
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-7 h-7 text-accent" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Career Growth</h4>
              <p className="text-sm text-muted-foreground">
                Access mentorship and resources to accelerate your tech career
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Award className="w-7 h-7 text-primary" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Recognition</h4>
              <p className="text-sm text-muted-foreground">
                Celebrate achievements and contributions to diversity in tech
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary to-accent text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Join the Movement?
          </h3>
          <p className="text-lg mb-8 opacity-90">
            Be part of a community that's shaping the future of technology through diversity and inclusion.
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate("/auth")} className="text-lg px-8">
            Create Your Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2025 NextGen Collar. Championing diversity and inclusion in technology.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
