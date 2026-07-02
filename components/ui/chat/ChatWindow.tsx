import { Message } from "@/lib/types";
import MessageBubble from "./MessageBubble";

interface Props {
  messages: Message[];
}

export default function ChatWindow({
  messages,
}: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
        />
      ))}
    </div>
  );
}