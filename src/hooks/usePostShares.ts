import { useToast } from "@/hooks/use-toast";

// Hook to copy post link to clipboard
export const useCopyPostLink = () => {
  const { toast } = useToast();

  return {
    copyLink: (postId: string) => {
      const postUrl = `${window.location.origin}/feed?post=${postId}`;
      
      navigator.clipboard.writeText(postUrl).then(
        () => {
          toast({ title: "Link copied to clipboard!" });
        },
        (err) => {
          toast({
            title: "Failed to copy link",
            description: err.message,
            variant: "destructive",
          });
        }
      );
    },
  };
};