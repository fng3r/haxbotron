import { useState } from 'react';
import TurndownService from 'turndown';

import { invariant } from '@epic-web/invariant';
import { Check, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface CopyButtonProps extends React.ComponentProps<typeof Button> {
  /**
   * Plain text content to copy to clipboard. Takes precedence over auto-generated plain-text version if HTML is provided.
   */
  text?: string;

  /**
   * Text displayed on the copy button. If not provided, the button will only show the copied icon.
   */
  buttonText?: string;

  /**
   * HTML content to copy to clipboard. Will be converted to markdown for plain text format.
   * Used when text prop is not provided.
   */
  html?: string;

  /**
   * React ref to an HTML element whose innerHTML will be copied.
   * Used as fallback when neither text nor html props are provided.
   */
  htmlRef?: React.RefObject<HTMLElement | HTMLInputElement | null>;
}

export function CopyButton({ text, buttonText, html, htmlRef, className, ...props }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      if (!text && !html && !htmlRef?.current) {
        console.error('No text, HTML, or HTML reference to copy');
        return;
      }

      const htmlContent = html || htmlRef?.current?.innerHTML || (htmlRef?.current as HTMLInputElement)?.value || '';
      let textContent = text;

      if (!textContent && htmlContent) {
        const turndownService = new TurndownService();
        textContent = turndownService.turndown(htmlContent);
      }

      invariant(
        textContent,
        'textContent should exist. If you are using htmlRef, make sure to pass a ref to the html element.',
      );

      if (htmlContent) {
        const clipboardData = new ClipboardItem({
          'text/plain': new Blob([textContent], { type: 'text/plain' }),
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
        });
        await navigator.clipboard.write([clipboardData]);
      } else {
        await navigator.clipboard.writeText(textContent);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <Button variant="outline" size="sm" className={className} onClick={copyToClipboard} {...props}>
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {buttonText && <span className="ml-1">{copied ? 'Copied!' : buttonText}</span>}
    </Button>
  );
}
