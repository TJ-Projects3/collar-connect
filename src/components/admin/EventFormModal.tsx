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
import { TIMEZONES, getTimezoneLabel } from "@/lib/timezones";

// Convert a UTC ISO string to the "YYYY-MM-DDTHH:mm" format in a given timezone
// (suitable as the value for a datetime-local input)
function utcToLocalInput(utcStr: string, timezone: string): string {
  const date = new Date(utcStr);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value])
  );
  // Some locales return "24" for midnight with hour12:false
  const hour = parts.hour === "24" ? "00" : parts.hour;
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}`;
}

// Convert a "YYYY-MM-DDTHH:mm" string (from a datetime-local input) treated as
// a local time in the given IANA timezone, returning a UTC ISO string.
function localInputToUTC(localDateStr: string, timezone: string): string {
  // Treat the input as if it were UTC to establish a reference point
  const asIfUTC = new Date(localDateStr + ":00.000Z");

  // Format that UTC instant in the target timezone to see what local time it corresponds to
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(asIfUTC)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value])
  );
  const hour = parts.hour === "24" ? "00" : parts.hour;
  const tzAsUTC = new Date(
    `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}:${parts.second}Z`
  );

  // The offset between "asIfUTC" and "the timezone's local representation of asIfUTC"
  // tells us how far to shift to get the true UTC for the entered local time
  const offsetMs = asIfUTC.getTime() - tzAsUTC.getTime();
  return new Date(asIfUTC.getTime() + offsetMs).toISOString();
}

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  event_type: z.enum(["virtual", "in_person", "hybrid"]),
  timezone: z.string().min(1, "Timezone is required"),
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
  timezone: string;
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

const getBrowserTimezone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;

export const EventFormModal = ({
  event,
  open,
  onOpenChange,
  onSubmit,
}: EventFormModalProps) => {
  const defaultTimezone = event?.timezone || getBrowserTimezone() || "UTC";

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title || "",
      description: event?.description || "",
      event_type: event?.event_type || "virtual",
      timezone: defaultTimezone,
      start_time: event?.start_time
        ? utcToLocalInput(event.start_time, defaultTimezone)
        : "",
      end_time: event?.end_time
        ? utcToLocalInput(event.end_time, defaultTimezone)
        : "",
      location: event?.location || "",
      virtual_link: event?.virtual_link || "",
      capacity: event?.capacity ?? undefined,
      image_url: event?.image_url || "",
      is_published: event?.is_published ?? false,
    },
  });

  const eventType = form.watch("event_type");
  const selectedTimezone = form.watch("timezone");

  // Reset form when event prop changes (for editing)
  useEffect(() => {
    if (event) {
      const tz = event.timezone || getBrowserTimezone() || "UTC";
      form.reset({
        title: event.title || "",
        description: event.description || "",
        event_type: event.event_type || "virtual",
        timezone: tz,
        start_time: event.start_time ? utcToLocalInput(event.start_time, tz) : "",
        end_time: event.end_time ? utcToLocalInput(event.end_time, tz) : "",
        location: event.location || "",
        virtual_link: event.virtual_link || "",
        capacity: event.capacity ?? undefined,
        image_url: event.image_url || "",
        is_published: event.is_published ?? false,
      });
    } else {
      const tz = getBrowserTimezone() || "UTC";
      form.reset({
        title: "",
        description: "",
        event_type: "virtual",
        timezone: tz,
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
    // Convert the entered local times to UTC before saving
    const utcData = {
      ...data,
      start_time: localInputToUTC(data.start_time, data.timezone),
      end_time: localInputToUTC(data.end_time, data.timezone),
    };
    onSubmit(utcData);
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
                  <Select onValueChange={field.onChange} value={field.value}>
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

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <FormLabel>
                      Start Time *{" "}
                      <span className="text-xs text-muted-foreground font-normal">
                        ({getTimezoneLabel(selectedTimezone)})
                      </span>
                    </FormLabel>
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
                    <FormLabel>
                      End Time *{" "}
                      <span className="text-xs text-muted-foreground font-normal">
                        ({getTimezoneLabel(selectedTimezone)})
                      </span>
                    </FormLabel>
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
