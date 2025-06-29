import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="relative bottom-0 mt-auto w-full bg-accent p-5">
      <div className="mx-auto max-w-sm">
        <p className="text-center text-base">
          {'Powered by '}
          <Link href="https://github.com/dapucita/haxbotron" className="text-inherit hover:underline">
            Haxbotron
          </Link>
        </p>
        <p className="text-center text-sm text-muted-foreground">
          {'MIT License Copyright © '}
          {new Date().getFullYear()}{' '}
          <Link href="https://github.com/dapucita" className="text-inherit hover:underline">
            dapucita
          </Link>
        </p>
      </div>
    </footer>
  );
}
