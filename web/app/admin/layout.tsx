import AppSidebar from '@/components/common/AppSidebar';
import Footer from '@/components/common/Footer';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="mb-2 w-7xl mx-auto flex items-center gap-3 px-4 pt-3">
            <SidebarTrigger />
            <Separator orientation="vertical" />
            <span className="text-lg font-bold">Haxbotron Admin Dashboard</span>
          </header>
          <main className="w-7xl mx-auto p-4">{children}</main>
          <Footer />
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
