import { Message } from "@/lib/types";

interface Props {
  message: Message;
}

export default function MessageBubble({
  message,
}: Props) {
  const isUser = message.role === "user";

  return (
    <div
      className={`max-w-[70%] rounded-xl px-4 py-3 ${
        isUser
          ? "bg-black text-white ml-auto"
          : "bg-gray-200 text-black"
      }`}
    >
      {message.content}
    </div>
  );
}