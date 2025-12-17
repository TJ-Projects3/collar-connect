import { useState } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, MapPin, Clock } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { Navbar } from "@/components/Navbar";

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const events = [
    {
      id: 1,
      title: "Team Meeting",
      date: new Date(2025, 9, 15, 10, 0),
      location: "Conference Room A",
      type: "Meeting",
      description: "Monthly team sync and project updates",
    },
    {
      id: 2,
      title: "Workshop: Leadership Skills",
      date: new Date(2025, 9, 18, 14, 0),
      location: "Training Center",
      type: "Workshop",
      description: "Interactive workshop on developing leadership skills",
    },
    {
      id: 3,
      title: "Networking Event",
      date: new Date(2025, 9, 22, 18, 30),
      location: "Downtown Hotel",
      type: "Networking",
      description: "Connect with industry professionals",
    },
    {
      id: 4,
      title: "Webinar: Career Development",
      date: new Date(2025, 9, 25, 13, 0),
      location: "Online",
      type: "Webinar",
      description: "Learn strategies for advancing your career",
    },
    {
      id: 5,
      title: "Project Deadline",
      date: new Date(2025, 9, 31, 17, 0),
      location: "Remote",
      type: "Deadline",
      description: "Final submission for Q4 project",
    },
  ];

  const eventDates = events.map(event => event.date);
  
  const selectedDateEvents = selectedDate 
    ? events.filter(event => isSameDay(event.date, selectedDate))
    : [];

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "Meeting":
        return "bg-primary text-primary-foreground";
      case "Workshop":
        return "bg-secondary text-secondary-foreground";
      case "Networking":
        return "bg-accent text-accent-foreground";
      case "Webinar":
        return "bg-muted text-muted-foreground";
      case "Deadline":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
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
                          <Badge className={getEventTypeColor(event.type)}>{event.type}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(event.date, "h:mm a")}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </span>
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
            <div className="space-y-4">
              {events.map(event => (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <CardDescription className="mt-1">{event.description}</CardDescription>
                      </div>
                      <Badge className={getEventTypeColor(event.type)}>{event.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{format(event.date, "EEEE, MMMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{format(event.date, "h:mm a")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4">Add to Calendar</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Calendar;
