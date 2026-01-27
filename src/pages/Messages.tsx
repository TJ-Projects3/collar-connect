import { useEffect, useState, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useConversations,
  useConnections,
  useConversationMessages,
  useSendMessage,
} from "@/hooks/useMessaging";
import { formatDistanceToNow, format } from "date-fns";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Send, Loader2 } from "lucide-react";

const Messages = () => {
  const { user } = useAuth();
  const { data: conversations = [] } = useConversations();
  const { data: connections = [] } = useConnections();
  const sendMessage = useSendMessage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeRecipient, setActiveRecipient] = useState<string | null>(null);
  const [activeRecipientProfile, setActiveRecipientProfile] = useState<{
    full_name: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading: messagesLoading } =
    useConversationMessages(activeRecipient);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const startChat = (
    recipientId: string,
    profile: { full_name: string | null; avatar_url: string | null } | null
  ) => {
    setActiveRecipient(recipientId);
    setActiveRecipientProfile(profile);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("recipientId", recipientId);
      return params;
    });
  };

  // Initialize from URL recipientId
  useEffect(() => {
    const rid = searchParams.get("recipientId");
    if (rid && !activeRecipient) {
      setActiveRecipient(rid);
      // Try to find profile from conversations or connections
      const conv = conversations.find((c: any) => c.counterpart_id === rid);
      const conn = connections.find((c: any) => c.other_id === rid);
      setActiveRecipientProfile(
        conv?.counterpart_profile || conn?.other_profile || null
      );
    }
  }, [searchParams, conversations, connections, activeRecipient]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      <div className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-80px)]">
        {/* Left: People list */}
        <aside className="lg:col-span-4 space-y-4 overflow-hidden flex flex-col">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-2">
              <h3 className="font-semibold">Recent Chats</h3>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full px-4 pb-4">
                {conversations.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No recent messages.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((c: any) => (
                      <button
                        key={c.counterpart_id}
                        className={`w-full text-left rounded-lg transition-colors ${
                          activeRecipient === c.counterpart_id
                            ? "bg-primary/10"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() =>
                          startChat(c.counterpart_id, c.counterpart_profile)
                        }
                      >
                        <div className="flex items-center gap-3 p-2">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={c.counterpart_profile?.avatar_url || undefined}
                            />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
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
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {c.last_message?.created_at &&
                              formatDistanceToNow(
                                new Date(c.last_message.created_at),
                                { addSuffix: true }
                              )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="flex-shrink-0">
            <CardHeader className="pb-2">
              <h3 className="font-semibold">Connections</h3>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-48 px-4 pb-4">
                {connections.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No connections yet.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {connections.map((c: any) => (
                      <button
                        key={c.other_id}
                        className={`w-full text-left rounded-lg transition-colors ${
                          activeRecipient === c.other_id
                            ? "bg-primary/10"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => startChat(c.other_id, c.other_profile)}
                      >
                        <div className="flex items-center gap-3 p-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={c.other_profile?.avatar_url || undefined}
                            />
                            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                              {getInitials(c.other_profile?.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {c.other_profile?.full_name || "Unknown"}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>

        {/* Right: Chat area */}
        <main className="lg:col-span-8 flex flex-col overflow-hidden">
          <Card className="flex-1 flex flex-col overflow-hidden">
            {activeRecipient ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={activeRecipientProfile?.avatar_url || undefined}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(activeRecipientProfile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {activeRecipientProfile?.full_name || "Unknown User"}
                      </h3>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages Area */}
                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-full p-4">
                    {messagesLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <p>No messages yet.</p>
                        <p className="text-sm">
                          Start the conversation by sending a message below.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg: any) => {
                          const isMine = msg.sender_id === user?.id;
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                  isMine
                                    ? "bg-primary text-primary-foreground rounded-br-md"
                                    : "bg-muted rounded-bl-md"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {msg.content}
                                </p>
                                <p
                                  className={`text-xs mt-1 ${
                                    isMine
                                      ? "text-primary-foreground/70"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {format(new Date(msg.created_at), "p")}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>

                {/* Message Input */}
                <div className="border-t p-4 flex-shrink-0">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={sendMessage.isPending || !messageText.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg font-medium">Welcome to Messages</p>
                  <p className="text-sm mt-1">
                    Select a person from Recent Chats or Connections to start
                    messaging.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Messages;
