import { useState } from 'react';
import { MessageBubble } from './components/MessageBubble';
import { demoThreads } from './demo/fixtures';

export function App() {
  const [selectedId, setSelectedId] = useState<string>(demoThreads[0].id);
  const selected = demoThreads.find((thread) => thread.id === selectedId) ?? demoThreads[0];

  return (
    <div className="app-shell">
      <header className="global-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">V</span>
          <span className="brand-name">VeilChat</span>
          <span className="prototype-tag">UI PROTOTYPE</span>
        </div>
        <span className="header-caption">Open source · self-hosted first</span>
      </header>

      <div className="security-banner" role="status">
        <strong>Not a secure messenger yet.</strong>
        <span>No E2EE, accounts, network messaging, or key storage. Only synthetic data is shown.</span>
      </div>

      <main className="workspace" aria-label="Local synthetic chat preview">
        <aside className="conversation-sidebar" aria-label="Demo conversations">
          <div className="sidebar-heading">
            <h1>Conversations</h1>
            <p>Local preview</p>
          </div>
          <nav aria-label="Select a synthetic conversation">
            {demoThreads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                className={selected.id === thread.id ? 'thread-button active' : 'thread-button'}
                aria-pressed={selected.id === thread.id}
                onClick={() => setSelectedId(thread.id)}
                data-testid={`thread-${thread.id}`}
              >
                <span className="thread-avatar" aria-hidden="true">{thread.initials}</span>
                <span className="thread-copy">
                  <strong>{thread.label}</strong>
                  <small>{thread.description}</small>
                </span>
              </button>
            ))}
          </nav>
          <p className="sidebar-footer">These examples are bundled with the app. No personal data is loaded.</p>
        </aside>

        <section className="chat-panel" aria-label={`Conversation: ${selected.label}`}>
          <div className="chat-header">
            <span className="thread-avatar large" aria-hidden="true">{selected.initials}</span>
            <div>
              <h2>{selected.label}</h2>
              <p>{selected.description}</p>
            </div>
            <span className="offline-indicator">Offline demo</span>
          </div>

          <div className="chat-content">
            <div className="conversation-note">
              <strong>Static fixture · not private</strong>
              <span>Message content below is rendered as literal text, never executable HTML.</span>
            </div>
            <ol className="message-list" aria-label="Synthetic messages" data-testid="messages">
              {selected.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </ol>
          </div>

          <div className="composer" aria-label="Messaging not available">
            <label htmlFor="preview-composer">Message composer</label>
            <div className="composer-controls">
              <input
                id="preview-composer"
                type="text"
                disabled
                placeholder="Messaging is disabled until E2EE is integrated"
                aria-describedby="composer-note"
              />
              <button type="button" disabled>Send unavailable</button>
            </div>
            <p id="composer-note">Do not enter real messages. This build has no encrypted transport.</p>
          </div>
        </section>
      </main>
      <footer className="global-footer">VeilChat research prototype · not suitable for sensitive communications</footer>
    </div>
  );
}
