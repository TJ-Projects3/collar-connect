import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { EventFormModal } from "./EventFormModal";
import { format } from "date-fns";

// Mock data for frontend development
const mockEvents = [
  {
    id: "1",
    title: "Tech Diversity Summit 2024",
    description: "Annual summit bringing together leaders in tech diversity...",
    event_type: "hybrid" as const,
    start_time: "2024-03-15T09:00:00Z",
    end_time: "2024-03-15T17:00:00Z",
    location: "San Francisco Convention Center",
    virtual_link: "https://zoom.us/j/123456789",
    capacity: 500,
    image_url: null,
    is_published: true,
    created_at: "2024-01-10T08:00:00Z",
  },
  {
    id: "2",
    title: "Inclusive Leadership Workshop",
    description: "Virtual workshop on developing inclusive leadership skills...",
    event_type: "virtual" as const,
    start_time: "2024-02-20T14:00:00Z",
    end_time: "2024-02-20T16:00:00Z",
    location: null,
    virtual_link: "https://zoom.us/j/987654321",
    capacity: 100,
    image_url: null,
    is_published: true,
    created_at: "2024-01-08T10:30:00Z",
  },
  {
    id: "3",
    title: "Networking Mixer",
    description: "In-person networking event for D&I professionals...",
    event_type: "in_person" as const,
    start_time: "2024-02-28T18:00:00Z",
    end_time: "2024-02-28T21:00:00Z",
    location: "The Tech Hub, 123 Innovation Way",
    virtual_link: null,
    capacity: 75,
    image_url: null,
    is_published: false,
    created_at: "2024-01-15T11:00:00Z",
  },
];

const eventTypeColors: Record<string, string> = {
  virtual: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  in_person: "bg-green-500/10 text-green-500 border-green-500/20",
  hybrid: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

const eventTypeLabels: Record<string, string> = {
  virtual: "Virtual",
  in_person: "In Person",
  hybrid: "Hybrid",
};

export const EventsTab = () => {
  const [events, setEvents] = useState(mockEvents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<typeof mockEvents[0] | null>(null);

  const handleCreate = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (event: typeof mockEvents[0]) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const handleTogglePublish = (id: string) => {
    setEvents(events.map(e => 
      e.id === id ? { ...e, is_published: !e.is_published } : e
    ));
  };

  const handleSubmit = (data: any) => {
    if (editingEvent) {
      setEvents(events.map(e => 
        e.id === editingEvent.id ? { ...e, ...data } : e
      ));
    } else {
      const newEvent = {
        ...data,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
      };
      setEvents([newEvent, ...events]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-center">Capacity</TableHead>
              <TableHead className="text-center">Published</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {event.title}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={eventTypeColors[event.event_type]}>
                    {eventTypeLabels[event.event_type]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(event.start_time), "MMM d, yyyy h:mm a")}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[150px] truncate">
                  {event.location || event.virtual_link ? "Virtual" : "—"}
                </TableCell>
                <TableCell className="text-center">
                  {event.capacity || "∞"}
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={event.is_published}
                    onCheckedChange={() => handleTogglePublish(event.id)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {events.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No events found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <EventFormModal
        event={editingEvent}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
