import AppBar from "@/components/common/AppBar";


export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {

    return (
        <>
            <AppBar />
            <main>
                {children}
            </main>
        </>
    );
  }