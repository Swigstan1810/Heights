import { SignUpForm } from "@/components/auth/signup-form";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 border-b">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <div className="relative flex items-center justify-center h-8 w-8 mr-2">
              <svg viewBox="0 0 100 100" className="h-6 w-6">
                <path
                  d="M30,20 L30,80"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="16"
                  strokeLinecap="square"
                />
                <path
                  d="M30,20 L80,20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="16"
                  strokeLinecap="square"
                />
              </svg>
            </div>
            <span className="text-xl font-bold">Heights</span>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4">
        <SignUpForm />
      </main>

      <footer className="p-4 border-t">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Heights Trading Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}