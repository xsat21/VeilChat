import type { DemoMessage } from '../demo/fixtures';

type MessageBubbleProps = Readonly<{ message: DemoMessage }>;

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <li className={message.sender === 'self' ? 'message self' : 'message peer'}>
      <div className="message-card">
        {/* Text only. Never parse HTML, auto-link URLs, or use an HTML injection sink. */}
        <p className="message-body" data-testid="message-body">{message.body}</p>
        <time className="message-time">{message.time}</time>
      </div>
    </li>
  );
}
