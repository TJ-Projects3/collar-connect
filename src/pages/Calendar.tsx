import { useState } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, MapPin, Clock, Loader2 } from "lucide-react";
import { format, isSameDay } from "date-fns";

function formatInTimezone(utcStr: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone || "UTC",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(new Date(utcStr));
}

function parseEventDate(utcStr: string, timezone: string): Date {
  // Returns a Date that represents the event's local date in its timezone,
  // normalized so calendar day comparisons work correctly.
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date(utcStr))
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value])
  );
  return new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00`);
}
import { Navbar } from "@/components/Navbar";
import { useEvents } from "@/hooks/useEvents";

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { data: events = [], isLoading } = useEvents();

  const eventDates = events.map(event => parseEventDate(event.start_time, event.timezone));

  const selectedDateEvents = selectedDate
    ? events.filter(event => isSameDay(parseEventDate(event.start_time, event.timezone), selectedDate))
    : [];

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "virtual":
        return "bg-primary text-primary-foreground";
      case "in_person":
        return "bg-secondary text-secondary-foreground";
      case "hybrid":
        return "bg-accent text-accent-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatEventType = (type: string) => {
    switch (type) {
      case "virtual":
        return "Virtual";
      case "in_person":
        return "In Person";
      case "hybrid":
        return "Hybrid";
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Event Calendar
                </CardTitle>
                <CardDescription>
                  Select a date to view events
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  modifiers={{
                    hasEvent: eventDates,
                  }}
                  modifiersClassNames={{
                    hasEvent: "bg-primary text-primary-foreground font-bold",
                  }}
                />
              </CardContent>
            </Card>

            {selectedDate && selectedDateEvents.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Events on {format(selectedDate, "MMMM d, yyyy")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedDateEvents.map(event => (
                    <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{event.title}</h4>
                          <Badge className={getEventTypeColor(event.event_type)}>
                            {formatEventType(event.event_type)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatInTimezone(event.start_time, event.timezone)}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : events.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No upcoming events scheduled.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {events.map(event => (
                  <Card key={event.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{event.title}</CardTitle>
                          {event.description && (
                            <CardDescription className="mt-1">{event.description}</CardDescription>
                          )}
                        </div>
                        <Badge className={getEventTypeColor(event.event_type)}>
                          {formatEventType(event.event_type)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{format(parseEventDate(event.start_time, event.timezone), "EEEE, MMMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{formatInTimezone(event.start_time, event.timezone)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                      <Button className="w-full mt-4">Register</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Calendar;
