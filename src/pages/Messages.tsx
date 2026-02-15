import { useEffect, useState, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConversations, useConversationMessages, useSendMessage } from "@/hooks/useMessaging";
import { formatDistanceToNow, format, isToday } from "date-fns";

const formatMessageTime = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) {
    return format(date, "h:mm a");
  }
  return format(date, "M/d/yyyy, h:mm a");
};
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Send } from "lucide-react";

const Messages = () => {
  const { user } = useAuth();
  const { data: conversations = [], refetch } = useConversations();
  const sendMessage = useSendMessage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeRecipient, setActiveRecipient] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get active recipient's profile from conversations
  const activeConversation = conversations.find((c) => c.counterpart_id === activeRecipient);

  // Fetch messages for active conversation
  const { data: messages = [], isLoading: messagesLoading } = useConversationMessages(activeRecipient);

  // Ensure Recent Chats are fetched when user is loaded
  useEffect(() => {
    if (user?.id) {
      refetch();
    }
  }, [user?.id, refetch]);

  // Initialize from URL recipientId
  useEffect(() => {
    const rid = searchParams.get("recipientId");
    if (rid) setActiveRecipient(rid);
  }, [searchParams]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const startChat = (recipientId: string) => {
    setActiveRecipient(recipientId);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("recipientId", recipientId);
      return params;
    });
  };

  const handleSend = () => {
    if (!activeRecipient || !messageText.trim()) return;
    sendMessage.mutate({ recipientId: activeRecipient, content: messageText.trim() });
    setMessageText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Chats */}
        <aside className="lg:col-span-4">
          <Card className="h-[calc(100vh-8rem)]">
            <CardHeader className="border-b">
              <h3 className="font-semibold">Recent Chats</h3>
            </CardHeader>
            <ScrollArea className="h-[calc(100%-4rem)]">
              <CardContent className="p-2">
                {conversations.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 text-center">
                    No recent messages. Visit a profile to start a conversation.
                  </p>
                ) : (
                  conversations.map((c) => (
                    <button
                      key={c.counterpart_id}
                      className={`w-full text-left rounded-lg transition-colors ${
                        activeRecipient === c.counterpart_id
                          ? "bg-primary/10"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => startChat(c.counterpart_id)}
                    >
                      <div className="flex items-center gap-3 p-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={c.counterpart_profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {getInitials(c.counterpart_profile?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {c.counterpart_profile?.full_name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {c.last_message?.content}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground shrink-0">
                          {c.last_message?.created_at &&
                            formatDistanceToNow(new Date(c.last_message.created_at), {
                              addSuffix: false,
                            })}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </ScrollArea>
          </Card>
        </aside>

        {/* Right: Chat Area */}
        <main className="lg:col-span-8">
          <Card className="h-[calc(100vh-8rem)] flex flex-col">
            {activeRecipient && activeConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b flex flex-row items-center gap-3 py-3">
                  <Link to={`/profile?userId=${activeRecipient}`}>
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={activeConversation.counterpart_profile?.avatar_url || undefined}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getInitials(activeConversation.counterpart_profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <Link
                      to={`/profile?userId=${activeRecipient}`}
                      className="font-semibold hover:underline"
                    >
                      {activeConversation.counterpart_profile?.full_name || "Unknown"}
                    </Link>
                  </div>
                </CardHeader>

                {/* Messages Container */}
                <ScrollArea className="flex-1 p-4">
                  {messagesLoading ? (
                    <p className="text-center text-muted-foreground py-8">Loading messages...</p>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No messages yet. Send a message to start the conversation!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => {
                        const isOwn = msg.sender_id === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                isOwn
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-foreground"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                                }`}
                              >
{formatMessageTime(msg.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="min-h-[44px] max-h-32 resize-none"
                      rows={1}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={sendMessage.isPending || !messageText.trim()}
                      size="icon"
                      className="shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : activeRecipient && !activeConversation ? (
              // New conversation - need to fetch recipient profile
              <NewConversationView
                recipientId={activeRecipient}
                messageText={messageText}
                setMessageText={setMessageText}
                handleSend={handleSend}
                handleKeyDown={handleKeyDown}
                sendMessage={sendMessage}
                getInitials={getInitials}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm">Choose from your recent chats or visit a profile to message someone.</p>
                </div>
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
};

// Component for starting a new conversation (when recipient isn't in conversations yet)
const NewConversationView = ({
  recipientId,
  messageText,
  setMessageText,
  handleSend,
  handleKeyDown,
  sendMessage,
  getInitials,
}: {
  recipientId: string;
  messageText: string;
  setMessageText: (text: string) => void;
  handleSend: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  sendMessage: ReturnType<typeof useSendMessage>;
  getInitials: (name: string | null | undefined) => string;
}) => {
  const { data: messages = [], isLoading: messagesLoading } = useConversationMessages(recipientId);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch recipient profile
  const { data: recipientProfile } = useQuery({
    queryKey: ["profile", recipientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", recipientId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!recipientId,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      <CardHeader className="border-b flex flex-row items-center gap-3 py-3">
        <Link to={`/profile?userId=${recipientId}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={recipientProfile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {getInitials(recipientProfile?.full_name)}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div>
          <Link to={`/profile?userId=${recipientId}`} className="font-semibold hover:underline">
            {recipientProfile?.full_name || "Loading..."}
          </Link>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-4">
        {messagesLoading ? (
          <p className="text-center text-muted-foreground py-8">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Send a message to start the conversation!
          </p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
{formatMessageTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={sendMessage.isPending || !messageText.trim()}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
};

// Need to import these for NewConversationView
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default Messages;
