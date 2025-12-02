import { signIn } from "next-auth/react";
import QuizifyNavbar from "./QuizifyNavbar";

const Login = (props: { goToQuiz: any; }) => {
  // console.log("init login");


  const handleStudent = async () => {
    try {
      const result = await signIn("google-student");
      if (!result?.ok) {
        throw new Error("Failed to sign in with Google");
      }
    }
    catch (error) {
      console.error('Error during user registration:', error);
    }
  }

  const handleTeacher = async () => {
    try {
      const result = await signIn("google-teacher");    
      if (!result?.ok) {
        throw new Error("Failed to sign in with Google");
      }
    }
    catch(error) {
      console.error('Error during user registration:', error);
    }
  }
  
  
  return (
    <div className="flex flex-col min-h-screen h-full max-h-full">
      <QuizifyNavbar
        goToQuiz={props.goToQuiz}
        handleStudent={handleStudent}
        handleTeacher={handleTeacher}
      />
      <div className="flex grow items-center justify-center h-full max-h-full">
        <h1 className="text-8xl font-bold text-center">WELCOME TO QUIZIFY</h1>

      </div>
    </div>
  );



}

export default Login;