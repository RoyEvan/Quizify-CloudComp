"use client";

import Login from "@/components/Login";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const goToQuiz = () => {
    router.push('/student/quiz')
  }


  return (
    <Login goToQuiz={goToQuiz} />
  );
}
