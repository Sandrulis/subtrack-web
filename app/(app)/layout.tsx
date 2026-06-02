import "@/styles/subtrack-app-critical.bundle.css";
import { AppDeferredStyles } from "@/components/app/app-deferred-styles";

export default function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <link
        rel="preload"
        href="/styles/subtrack-app-deferred.bundle.css"
        as="style"
      />
      <AppDeferredStyles />
      {children}
    </>
  );
}
