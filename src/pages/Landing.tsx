import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Compass,
  Heart,
  MessageSquare,
  Smartphone,
  Users,
} from "lucide-react";

const coreValues = [
  {
    icon: BadgeCheck,
    title: "Verified Portfolios",
    description:
      "Students showcase real projects and experiences that recruiters can trust at a glance.",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    icon: Compass,
    title: "Career Mapping",
    description:
      "Guided pathways help students discover roles, build skills, and track their progress.",
    gradient: "from-secondary/20 to-secondary/5",
  },
  {
    icon: Users,
    title: "Direct Connections",
    description:
      "One-click messaging and networking that brings students and recruiters together.",
    gradient: "from-accent/20 to-accent/5",
  },
];

const liveFeatures = [
  {
    icon: Heart,
    title: "Vibrant Community Feed",
    description:
      "A multi-reaction system powers an engaging feed where students and recruiters celebrate wins and share insights.",
  },
  {
    icon: Smartphone,
    title: "Seamless Mobile Experience",
    description:
      "Every screen is built to feel native on phones, so talent and opportunities are never out of reach.",
  },
  {
    icon: MessageSquare,
    title: "Dynamic Discussions",
    description:
      "In-line comment editing and threaded replies keep conversations clear, current, and productive.",
  },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            NextGen Collar
          </h1>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/auth")}
              className="hidden sm:inline-flex"
            >
              Sign In
            </Button>
            <Button size="sm" onClick={() => navigate("/auth")}>
              Join Now
            </Button>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16 sm:py-20 lg:py-28">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className="space-y-6 sm:space-y-8 text-center lg:text-left animate-fade-in">
                <div className="inline-flex items-center rounded-full border bg-background/60 px-3 py-1 text-xs sm:text-sm font-medium text-primary shadow-sm">
                  <span className="mr-2 h-2 w-2 rounded-full bg-accent animate-pulse" />
                  Welcome to NextGen Collar
                </div>

                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
                  <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                    Where Diverse Talent
                  </span>
                  <br />
                  <span className="text-foreground">Meets Industry Excellence</span>
                </h2>

                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Helping students map their tech careers while empowering
                  recruiters to discover vetted, diverse talent.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
                  <Button
                    size="lg"
                    onClick={() => navigate("/auth")}
                    className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    Map Your Career
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate("/auth")}
                    className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 border-2 hover:bg-accent hover:text-accent-foreground hover:scale-105 transition-all duration-300"
                  >
                    Find Top Talent
                  </Button>
                </div>
              </div>

              {/* Hero Visual */}
              <div className="relative mx-auto w-full max-w-md lg:max-w-none animate-fade-in">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-3xl blur-2xl transform rotate-3" />
                <Card className="relative p-6 sm:p-8 rounded-3xl border bg-background/90 shadow-card backdrop-blur-sm">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-lg shadow-md">
                        NG
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">NextGen Collar</p>
                        <p className="text-sm text-muted-foreground">
                          Bridging talent & opportunity
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl bg-muted p-4 text-center">
                        <p className="text-2xl sm:text-3xl font-bold text-primary">10k+</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Student Members
                        </p>
                      </div>
                      <div className="rounded-2xl bg-muted p-4 text-center">
                        <p className="text-2xl sm:text-3xl font-bold text-accent">500+</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Hiring Recruiters
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 p-4">
                      <p className="text-sm font-medium text-foreground">
                        “The fastest way to connect diverse student talent with
                        top tech recruiters.”
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Core Value Grid */}
        <section className="py-16 sm:py-20 lg:py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
              <h3 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Built for Students. Built for Recruiters.
              </h3>
              <p className="text-base sm:text-lg text-muted-foreground">
                Three pillars that make NextGen Collar the place where careers
                launch and teams grow.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {coreValues.map((value, idx) => (
                <Card
                  key={idx}
                  className="group relative overflow-hidden rounded-2xl border bg-card p-6 sm:p-8 shadow-card transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${value.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  />
                  <div className="relative z-10">
                    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                      <value.icon className="h-6 w-6" />
                    </div>
                    <h4 className="text-xl font-semibold text-card-foreground mb-2">
                      {value.title}
                    </h4>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Live Features Showcase */}
        <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-muted/50 to-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
              <h3 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Live Features
              </h3>
              <p className="text-base sm:text-lg text-muted-foreground">
                The platform is already alive with tools that make networking,
                learning, and hiring feel effortless.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {liveFeatures.map((feature, idx) => (
                <Card
                  key={idx}
                  className="group relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-card to-muted p-6 sm:p-8 shadow-card transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl"
                >
                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-all duration-500 group-hover:bg-accent/10" />
                  <div className="relative z-10">
                    <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <feature.icon className="h-7 w-7" />
                    </div>
                    <h4 className="text-xl font-semibold text-card-foreground mb-3">
                      {feature.title}
                    </h4>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-primary to-accent text-primary-foreground">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Build the Future of Tech?
            </h3>
            <p className="text-base sm:text-lg opacity-90 max-w-2xl mx-auto mb-8">
              Whether you are mapping your career or searching for your next
              great hire, NextGen Collar is where it happens.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate("/auth")}
                className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 hover:scale-105 transition-all duration-300"
              >
                Map Your Career
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth")}
                className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:scale-105 transition-all duration-300"
              >
                Find Top Talent
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-8 sm:py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} NextGen Collar. Championing
            diversity and inclusion in technology.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
