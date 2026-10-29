/**
 * PUBLIC, synthetic fixtures for evaluating the chat UI.
 * Do not use production messages, real user names, credentials, or keys here.
 */
export type DemoMessage = Readonly<{
  id: string;
  sender: 'peer' | 'self';
  body: string;
  time: string;
}>;

export type DemoThread = Readonly<{
  id: string;
  label: string;
  initials: string;
  description: string;
  messages: readonly DemoMessage[];
}>;

export const demoThreads: readonly DemoThread[] = [
  {
    id: 'sample-alpha',
    label: 'Sample conversation',
    initials: 'SC',
    description: 'Synthetic messages · no connection',
    messages: [
      { id: 'm1', sender: 'peer', body: 'Welcome to the local VeilChat interface preview.', time: '09:41' },
      { id: 'm2', sender: 'self', body: 'Are these messages encrypted or delivered to another device?', time: '09:42' },
      { id: 'm3', sender: 'peer', body: 'No. These are public synthetic fixtures, stored in the application source.', time: '09:43' },
      { id: 'm4', sender: 'self', body: 'We will add real messaging only after protocol and identity reviews.', time: '09:44' },
    ],
  },
  {
    id: 'xss-fixtures',
    label: 'Rendering test fixtures',
    initials: 'XT',
    description: 'Untrusted text · safe rendering test',
    messages: [
      { id: 't1', sender: 'peer', body: '<img src=x onerror=alert("xss")>', time: '10:01' },
      { id: 't2', sender: 'self', body: '<script>alert("xss")</script>', time: '10:02' },
      { id: 't3', sender: 'peer', body: '<svg onload=alert("xss")></svg>', time: '10:03' },
      { id: 't4', sender: 'self', body: 'javascript:alert("xss") is text, not a clickable link.', time: '10:04' },
      { id: 't5', sender: 'peer', body: '<b>markup is not formatted</b> & links are not auto-generated.', time: '10:05' },
    ],
  },
];
