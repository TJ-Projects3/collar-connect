import { useState } from "react";
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
import { useProfile } from "@/hooks/useProfile";
import { useCreatePost } from "@/hooks/usePosts";

const postSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Post content is required")
    .max(2000, "Post must be less than 2000 characters"),
});

type PostFormData = z.infer<typeof postSchema>;

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreatePostModal = ({ open, onOpenChange }: CreatePostModalProps) => {
  const { data: profile } = useProfile();
  const createPost = useCreatePost();

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: { content: "" },
  });

  const onSubmit = async (data: PostFormData) => {
    await createPost.mutateAsync(data.content);
    form.reset();
    onOpenChange(false);
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

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createPost.isPending}>
                {createPost.isPending ? "Posting..." : "Post"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
