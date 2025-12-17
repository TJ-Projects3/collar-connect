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
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { EventFormModal } from "./EventFormModal";
import { format } from "date-fns";
import { useAdminEvents, useCreateEvent, useUpdateEvent, useDeleteEvent, type Event } from "@/hooks/useAdminEvents";

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
  const { data: events = [], isLoading } = useAdminEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const handleCreate = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteEvent.mutate(id);
  };

  const handleTogglePublish = (event: Event) => {
    updateEvent.mutate({ id: event.id, is_published: !event.is_published });
  };

  const handleSubmit = (data: any) => {
    const eventData = {
      title: data.title,
      description: data.description || null,
      event_type: data.event_type,
      start_time: data.start_time,
      end_time: data.end_time,
      location: data.location || null,
      virtual_link: data.virtual_link || null,
      capacity: data.capacity ? parseInt(data.capacity) : null,
      image_url: data.image_url || null,
      is_published: data.is_published ?? false,
    };

    if (editingEvent) {
      updateEvent.mutate({ id: editingEvent.id, ...eventData });
    } else {
      createEvent.mutate(eventData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
                  {event.location || (event.virtual_link ? "Virtual" : "—")}
                </TableCell>
                <TableCell className="text-center">
                  {event.capacity || "∞"}
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={event.is_published ?? false}
                    onCheckedChange={() => handleTogglePublish(event)}
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
