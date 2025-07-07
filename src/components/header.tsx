import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "./theme-toggle"
// import { UserNav } from "./user-nav" // Auth disabled for now

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
       <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="flex-1">
        <h1 className="text-lg font-semibold md:text-xl font-headline">Dashboard</h1>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {/* <UserNav /> */}
      </div>
    </header>
  )
}
