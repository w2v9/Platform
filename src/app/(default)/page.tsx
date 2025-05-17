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


  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    };
  }, [user]);

  return (
    <div className="flex flex-row md:flex-col lg:flex-col items-center justify-between p-8 md:p-16 lg:p-24">
      <div className="flex md:flex-row lg:flex-row flex-col items-center">
        <Image
          src="/images/logo.png"
          alt="Next.js Logo"
          width={300}
          height={300}
          priority
        />
        <div className="flex flex-col items-start justify-center gap-2 ">
          <h1 className="text-4xl font-bold text-gray-800">Welcome to our Quiz App</h1>
          <p className="mt-2 text-lg text-gray-600 max-w-[80vw] md:max-w-[40vw] lg:max-w-[40vw]">
            Your one-stop solution for creating and taking quizzes. Please login using your credentials to continue.
          </p>
          <div>
            <Button variant={"primary"}>
              <CustomLink href="/login" className="cursor-pointer">
                Login
              </CustomLink>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
