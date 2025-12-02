import { ObjectId } from "mongodb";
import Quiz from "./quiz";

interface Student {
  _id: string | ObjectId;
  quizActive: any;
  quizAttempted: any;
  quizDetail: any;
  quizJoined: Quiz[];
  quizDone: Quiz[];
  status: "idle" | "pending" | "succeeded" | "failed";
  error: string | null | undefined;
  msg: string;
}

export default Student;
