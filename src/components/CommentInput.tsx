import { useState, KeyboardEvent, useRef, useId } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Image as ImageIcon, Smile, X, Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useCreateReply } from "@/hooks/usePostReplies";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { GifPicker } from "@/components/GifPicker";

interface CommentInputProps {
  postId: string;
}

export const CommentInput = ({ postId }: CommentInputProps) => {
  const { data: profile } = useProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  const [value, setValue] = useState("");
  const [media, setMedia] = useState<{ url: string; type: "image" | "gif" } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();
  const createReply = useCreateReply();


  const initials = (profile?.full_name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const submit = () => {
    const content = value.trim();
    if ((!content && !media) || createReply.isPending) return;
    createReply.mutate(
      { postId, content, mediaUrl: media?.url ?? null, mediaType: media?.type ?? null },
      {
        onSuccess: () => {
          setValue("");
          setMedia(null);
        },
      }
    );
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be under 5MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `comments/${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("content-images").upload(path, file);
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

  const canSubmit = (value.trim().length > 0 || !!media) && !createReply.isPending;

  return (
    <div className="flex items-start gap-2 pt-1">
      <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
        <AvatarImage src={profile?.avatar_url || undefined} />
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        {media && (
          <div className="relative inline-block">
            <img
              src={media.url}
              alt="Attachment preview"
              className="max-h-40 rounded-md border border-border object-cover"
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
        <div className="relative">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a comment..."
            className="h-9 rounded-full bg-muted/40 border-muted-foreground/20 pr-24 text-sm"
            disabled={createReply.isPending}
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {/* Cross-browser file input: <label htmlFor> triggers the native picker
                on Windows/Android/Linux without a synthetic JS click. */}
            <input
              ref={fileRef}
              id={fileInputId}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFile}
              disabled={uploading || !!media}
            />
            <Button
              asChild
              type="button"
              size="icon"
              variant="ghost"
              disabled={uploading || !!media}
              className="h-7 w-7 text-muted-foreground hover:text-primary"
            >
              <label htmlFor={fileInputId} aria-label="Attach image" className="cursor-pointer">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              </label>
            </Button>
            <GifPicker
              onSelect={(url) => setMedia({ url, type: "gif" })}
              trigger={
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={!!media}
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                  aria-label="Add GIF"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              }
            />
            {canSubmit && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={submit}
                disabled={createReply.isPending}
                className="h-7 w-7 text-primary hover:bg-primary/10"
                aria-label="Post comment"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

