import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Image as ImageIcon, Smile, X, Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useCreateReply, usePostReplies } from "@/hooks/usePostReplies";
import { useAuth } from "@/contexts/AuthContext";
import { RecruiterBadge } from "@/components/RecruiterBadge";
import { isRecruiter } from "@/lib/profile-display";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GifPicker } from "@/components/GifPicker";
import { formatDistanceToNow } from "date-fns";

const replySchema = z.object({
  content: z
    .string()
    .trim()
    .max(1000, "Reply must be less than 1000 characters")
    .default(""),
});

type ReplyFormData = z.infer<typeof replySchema>;

const stopSpaceKeyPropagation = (e: KeyboardEvent<HTMLElement>) => {
  if (e.key === " ") e.stopPropagation();
};

interface ReplyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postContent: string;
  postAuthor: string;
}

export const ReplyModal = ({
  open,
  onOpenChange,
  postId,
  postContent,
  postAuthor,
}: ReplyModalProps) => {
  const { data: profile } = useProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  const createReply = useCreateReply();
  const { data: replies = [] } = usePostReplies(postId);

  const fileInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState<{ url: string; type: "image" | "gif" } | null>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<ReplyFormData>({
    resolver: zodResolver(replySchema),
    defaultValues: { content: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ content: "" });
      setMedia(null);
    }
  }, [open]);

  const onSubmit = async (data: ReplyFormData) => {
    const content = (data.content ?? "").trim();
    if (!content && !media) {
      toast({ title: "Add some text or an attachment first", variant: "destructive" });
      return;
    }
    await createReply.mutateAsync({
      postId,
      content,
      mediaUrl: media?.url ?? null,
      mediaType: media?.type ?? null,
    });
    form.reset({ content: "" });
    setMedia(null);
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
      const path = `comments/${user.id}/${crypto.randomUUID()}.${ext}`;
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

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Reply to Post</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Original Post */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start gap-3 mb-2">
              <div className="flex-1">
                <p className="font-semibold text-sm">{postAuthor}</p>
                <p className="text-sm text-muted-foreground line-clamp-3 mt-1">
                  {postContent}
                </p>
              </div>
            </div>
          </div>

          {/* Existing Replies (scrollable) */}
          <Separator />
          <ScrollArea className="h-[40vh] pr-4">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground">
                {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
              </h4>
              {replies.length === 0 ? (
                <p className="text-sm text-muted-foreground">No replies yet.</p>
              ) : (
                replies.map((reply: any) => (
                  <div key={reply.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={reply.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials(reply.profiles?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">
                          {reply.profiles?.full_name || "Unknown User"}
                        </span>
                        {isRecruiter(reply.profiles) && (
                          <RecruiterBadge verified={reply.profiles?.is_verified_recruiter} compact />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {reply.content && <p className="text-sm mt-1">{reply.content}</p>}
                      {reply.media_url && (
                        <img
                          src={reply.media_url}
                          alt="Attachment"
                          className="mt-2 max-h-48 rounded-md border border-border object-cover"
                          loading="lazy"
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <Separator />

          {/* Reply Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} onKeyDown={stopSpaceKeyPropagation} className="space-y-3">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Textarea
                          placeholder="Write your reply..."
                          className="min-h-[80px] resize-none"
                          {...field}
                          onKeyDown={(e) => {
                            if (e.key === " ") e.stopPropagation();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {media && (
                <div className="relative inline-block ml-11">
                  <img
                    src={media.url}
                    alt="Attachment preview"
                    className="max-h-48 rounded-md border border-border object-contain"
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

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 ml-11">
                  {/* Native <label> file trigger for cross-browser support */}
                  <input
                    ref={fileRef}
                    id={fileInputId}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleFile}
                    onKeyDown={stopSpaceKeyPropagation}
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
                  <Button type="submit" disabled={createReply.isPending || uploading}>
                    {createReply.isPending ? "Posting..." : "Reply"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
