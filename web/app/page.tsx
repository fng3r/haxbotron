import Link from 'next/link';

import { BookOpen, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Main() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <h1 className="text-4xl font-bold tracking-tight">🤖 Haxbotron</h1>
          </div>
          <p className="text-xl text-muted-foreground">Welcome to Haxbotron!</p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Installation Card */}
          <Card className="shadow-md space-y-4">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Installation</span>
              </CardTitle>
              <CardDescription>You have to do initial configuration if this is your first run.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/install">Get Started</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Administration Card */}
          <Card className="shadow-md space-y-4">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Administration</span>
              </CardTitle>
              <CardDescription>You can control and manage your headless host server.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/admin">Go to Admin</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Documentation Card */}
          <Card className="shadow-md space-y-4">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Documentation</span>
              </CardTitle>
              <CardDescription>See our wiki to find out how to use Haxbotron.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="https://github.com/dapucita/haxbotron/wiki" target="_blank" rel="noopener noreferrer">
                  View Docs
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
