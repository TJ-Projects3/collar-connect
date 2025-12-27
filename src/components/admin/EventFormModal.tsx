import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  event_type: z.enum(["virtual", "in_person", "hybrid"]),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  location: z.string().optional(),
  virtual_link: z.string().url().optional().or(z.literal("")),
  capacity: z.coerce.number().min(0).optional(),
  image_url: z.string().url().optional().or(z.literal("")),
  is_published: z.boolean(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: "virtual" | "in_person" | "hybrid";
  start_time: string;
  end_time: string;
  location: string | null;
  virtual_link: string | null;
  capacity: number | null;
  image_url: string | null;
  is_published: boolean | null;
}

interface EventFormModalProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EventFormData) => void;
}

const formatDateTimeLocal = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toISOString().slice(0, 16);
};

export const EventFormModal = ({
  event,
  open,
  onOpenChange,
  onSubmit,
}: EventFormModalProps) => {
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title || "",
      description: event?.description || "",
      event_type: event?.event_type || "virtual",
      start_time: event?.start_time ? formatDateTimeLocal(event.start_time) : "",
      end_time: event?.end_time ? formatDateTimeLocal(event.end_time) : "",
      location: event?.location || "",
      virtual_link: event?.virtual_link || "",
      capacity: event?.capacity ?? undefined,
      image_url: event?.image_url || "",
      is_published: event?.is_published ?? false,
    },
  });

  const eventType = form.watch("event_type");

  // Reset form when event prop changes (for editing)
  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title || "",
        description: event.description || "",
        event_type: event.event_type || "virtual",
        start_time: event.start_time ? formatDateTimeLocal(event.start_time) : "",
        end_time: event.end_time ? formatDateTimeLocal(event.end_time) : "",
        location: event.location || "",
        virtual_link: event.virtual_link || "",
        capacity: event.capacity ?? undefined,
        image_url: event.image_url || "",
        is_published: event.is_published ?? false,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        event_type: "virtual",
        start_time: "",
        end_time: "",
        location: "",
        virtual_link: "",
        capacity: undefined,
        image_url: "",
        is_published: false,
      });
    }
  }, [event, form]);

  const handleSubmit = (data: EventFormData) => {
    onSubmit(data);
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {event ? "Edit Event" : "Create Event"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="event_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="virtual">Virtual</SelectItem>
                      <SelectItem value="in_person">In Person</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time *</FormLabel>
                    <FormControl>
                      <Input {...field} type="datetime-local" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time *</FormLabel>
                    <FormControl>
                      <Input {...field} type="datetime-local" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {(eventType === "in_person" || eventType === "hybrid") && (
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123 Main St, City, State" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {(eventType === "virtual" || eventType === "hybrid") && (
              <FormField
                control={form.control}
                name="virtual_link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Virtual Link</FormLabel>
                    <FormControl>
                      <Input {...field} type="url" placeholder="https://zoom.us/..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min={0} placeholder="Leave empty for unlimited" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input {...field} type="url" placeholder="https://..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_published"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Published</FormLabel>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {event ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
