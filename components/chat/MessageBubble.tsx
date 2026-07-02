import { Message } from "@/types";

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`message-bubble ${isUser ? "message-user" : "message-assistant"}`}>
      {!isUser && (
        <div className="message-avatar">
          <span>AI</span>
        </div>
      )}
      <div className={`message-content ${isUser ? "message-content-user" : "message-content-assistant"}`}>
        {message.content}
      </div>
    </div>
  );
}
