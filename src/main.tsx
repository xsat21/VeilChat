import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  return <main className="shell"><p className="eyebrow">OPEN SOURCE · SELF-HOSTED FIRST</p><h1>VeilChat</h1><p>A privacy-first messaging PWA in development.</p><section className="notice" aria-label="Security status"><strong>Not a secure messenger yet.</strong><p>This repository contains a frontend foundation only. No E2EE, authentication, key management, or production-ready messaging has been implemented.</p></section><p className="muted">Architecture and backend selection are pending review.</p></main>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
