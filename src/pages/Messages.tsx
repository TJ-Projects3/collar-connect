import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useConversations, useConnections, useSendMessage } from "@/hooks/useMessaging";
import { formatDistanceToNow } from "date-fns";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Messages = () => {
  const { user } = useAuth();
  const { data: conversations = [], refetch } = useConversations();
  const { data: connections = [] } = useConnections();
  const sendMessage = useSendMessage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeRecipient, setActiveRecipient] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");

  // Ensure Recent Chats are fetched when user is loaded
  useEffect(() => {
    if (user?.id) {
      refetch();
    }
  }, [user?.id, refetch]);

  // Explicit load chats on mount to guarantee persistence after refresh
  useEffect(() => {
    const loadChats = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return; // ⛔ DO NOT QUERY YET

      const { data, error } = await supabase
        .from("conversations")
        .select(`
          id,
          last_message,
          last_message_at,
          conversation_participants (
            user_id,
            user:user_id (full_name, avatar_url)
          )
        `)
        .order("last_message_at", { ascending: false });

      if (error) {
        console.error("Failed to load chats:", error);
        return;
      }

      // Invalidate and refetch to update the cache
      refetch();
    };

    loadChats();
  }, [refetch]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const startChat = (recipientId: string) => {
    setActiveRecipient(recipientId);
    // reflect in URL so deep-link works
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("recipientId", recipientId);
      return params;
    });
  };

  // Initialize from URL recipientId
  useEffect(() => {
    const rid = searchParams.get("recipientId");
    if (rid) setActiveRecipient(rid);
  }, [searchParams]);

  const handleSend = () => {
    if (!activeRecipient || !messageText.trim()) return;
    sendMessage.mutate({ recipientId: activeRecipient, content: messageText.trim() });
    setMessageText("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: People list */}
        <aside className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Recent Chats</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent messages.</p>
              ) : (
                conversations.map((c: any) => (
                  <button key={c.counterpart_id} className="w-full text-left" onClick={() => startChat(c.counterpart_id)}>
                    <div className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={c.counterpart_profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getInitials(c.counterpart_profile?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.counterpart_profile?.full_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.last_message?.content}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {c.last_message?.created_at && formatDistanceToNow(new Date(c.last_message.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold">Connections</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {connections.length === 0 ? (
                <p className="text-sm text-muted-foreground">No connections yet.</p>
              ) : (
                connections.map((c: any) => (
                  <button key={c.other_id} className="w-full text-left" onClick={() => startChat(c.other_id)}>
                    <div className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={c.other_profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                          {getInitials(c.other_profile?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.other_profile?.full_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground truncate">Connected</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </aside>

        {/* Right: Chat composer */}
        <main className="lg:col-span-8 space-y-4">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">New Message</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeRecipient ? (
                <div className="space-y-3">
                  <Input
                    placeholder="Type your message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleSend} disabled={sendMessage.isPending}>Send</Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Select a person from Recent Chats or Connections to start messaging.</p>
              )}
            </CardContent>
          </Card>

          <Separator />
        </main>
      </div>
    </div>
  );
};

export default Messages;
