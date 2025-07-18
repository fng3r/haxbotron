import { ModeToggle } from '@/components/ModeToggle';
import AppSidebar from '@/components/common/AppSidebar';
import Footer from '@/components/common/Footer';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="m-0!">
          <header className="mb-2 w-full max-w-7xl mx-auto flex justify-between px-4 pt-3">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-6!" />
              <span className="text-lg font-bold">Haxbotron Admin Dashboard</span>
            </div>
            <ModeToggle />
          </header>
          <main className="w-full max-w-7xl mx-auto p-4">{children}</main>
          <Footer />
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
