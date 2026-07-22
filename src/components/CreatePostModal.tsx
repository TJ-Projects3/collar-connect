import { useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Image as ImageIcon, Smile, X, Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useCreatePost } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GifPicker } from "@/components/GifPicker";

const postSchema = z.object({
  content: z
    .string()
    .trim()
    .max(2000, "Post must be less than 2000 characters")
    .default(""),
});

type PostFormData = z.infer<typeof postSchema>;

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialContent?: string;
}

export const CreatePostModal = ({ open, onOpenChange, initialContent }: CreatePostModalProps) => {
  const { data: profile } = useProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  const createPost = useCreatePost();
  const fileInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState<{ url: string; type: "image" | "gif" } | null>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: { content: initialContent ?? "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ content: initialContent ?? "" });
      setMedia(null);
    }
  }, [open, initialContent]);

  const onSubmit = async (data: PostFormData) => {
    const content = (data.content ?? "").trim();
    if (!content && !media) {
      toast({ title: "Add some text or an attachment first", variant: "destructive" });
      return;
    }
    await createPost.mutateAsync({
      content,
      mediaUrl: media?.url ?? null,
      mediaType: media?.type ?? null,
    });
    form.reset({ content: "" });
    setMedia(null);
    onOpenChange(false);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Image must be under 10MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `posts/${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("content-images")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("content-images").getPublicUrl(path);
      setMedia({ url: data.publicUrl, type: "image" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-3 pt-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium text-foreground">{profile?.full_name || "User"}</p>
            <p className="text-sm text-muted-foreground">{profile?.job_title || ""}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="What's on your mind?"
                      className="min-h-[120px] resize-none border-none focus-visible:ring-0 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {media && (
              <div className="relative inline-block">
                <img
                  src={media.url}
                  alt="Attachment preview"
                  className="max-h-64 rounded-md border border-border object-contain"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={() => setMedia(null)}
                  aria-label="Remove attachment"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-2 border-t">
              <div className="flex items-center gap-1">
                {/* Cross-browser file input: native <label htmlFor> triggers the file picker
                    on all platforms without needing JS .click() on a display:none input. */}
                <input
                  ref={fileRef}
                  id={fileInputId}
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  className="sr-only"
                  disabled={uploading || !!media}
                />
                <Button
                  asChild
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={uploading || !!media}
                  className="text-muted-foreground hover:text-primary"
                >
                  <label htmlFor={fileInputId} className="cursor-pointer flex items-center gap-2">
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImageIcon className="h-4 w-4" />
                    )}
                    <span>Photo</span>
                  </label>
                </Button>
                <GifPicker
                  onSelect={(url) => setMedia({ url, type: "gif" })}
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={!!media}
                      className="text-muted-foreground hover:text-primary gap-2"
                    >
                      <Smile className="h-4 w-4" />
                      <span>GIF</span>
                    </Button>
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPost.isPending || uploading}
                >
                  {createPost.isPending ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
