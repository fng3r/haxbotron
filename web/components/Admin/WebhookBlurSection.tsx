'use client';

import { useState } from 'react';

import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function WebhookBlurSection({
  children,
}: {
  children: (args: { blurred: boolean; toggle: React.ReactNode }) => React.ReactNode;
}) {
  const [blurred, setBlurred] = useState(true);

  const toggle = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => setBlurred((prev) => !prev)}
      aria-label={blurred ? 'Reveal webhook tokens' : 'Blur webhook tokens'}
      title={blurred ? 'Click to reveal webhook tokens' : 'Click to blur webhook tokens'}
    >
      {blurred ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      <span className="text-sm">{blurred ? 'Hidden' : 'Visible'}</span>
    </Button>
  );

  return children({ blurred, toggle });
}
