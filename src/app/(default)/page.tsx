'use client'
import Image from "next/image";
import { Button } from "@/components/ui/button";
import CustomLink from "@/components/Link";
import { useAuth } from "@/lib/context/authContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";


export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  // Set page title
  useEffect(() => {
    document.title = "AzoozGAT Platform - Home";
  }, []);

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    };
  }, [user, router]);
  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8 md:p-16 min-h-[80vh]">
      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12 max-w-6xl mx-auto">
        <div className="w-full md:w-1/2 flex justify-center">
          <Image
            src="/images/logo.png"
            alt="AzoozGAT Logo"
            width={250}
            height={250}
            priority
            className="w-48 sm:w-64 md:w-80"
          />
        </div>
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start justify-center gap-4 text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Welcome to AzoozGAT Platform</h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-md">
            Please login using your credentials to continue to the quiz platform.
          </p>
          <Button variant={"default"} size="lg" className="mt-2" onClick={() => router.push('/login')}>
            Sign in
          </Button>
        </div>
      </div>
    </div>
  );
}
