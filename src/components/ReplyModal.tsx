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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useProfile } from "@/hooks/useProfile";
import { useCreateReply, usePostReplies } from "@/hooks/usePostReplies";
import { formatDistanceToNow } from "date-fns";

const replySchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Reply cannot be empty")
    .max(1000, "Reply must be less than 1000 characters"),
});

type ReplyFormData = z.infer<typeof replySchema>;

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
  const createReply = useCreateReply();
  const { data: replies = [], isLoading: repliesLoading } = usePostReplies(postId);

  const form = useForm<ReplyFormData>({
    resolver: zodResolver(replySchema),
    defaultValues: { content: "" },
  });

  const onSubmit = async (data: ReplyFormData) => {
    await createReply.mutateAsync({ postId, content: data.content });
    form.reset();
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

          {/* Existing Replies */}
          {replies.length > 0 && (
            <>
              <Separator />
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground">
                    {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
                  </h4>
                  {replies.map((reply: any) => (
                    <div key={reply.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={reply.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getInitials(reply.profiles?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {reply.profiles?.full_name || "Unknown User"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}

          <Separator />

          {/* Reply Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createReply.isPending}>
                  {createReply.isPending ? "Posting..." : "Reply"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
