import { Message } from "@/types";
import MessageBubble from "./MessageBubble";

interface Props {
  messages: Message[];
}

export default function ChatWindow({ messages }: Props) {
  return (
    <div className="chat-window">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}
