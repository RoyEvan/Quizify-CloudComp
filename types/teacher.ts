import { ObjectId } from "mongodb";
import Quiz from "./quiz";

interface Teacher {
  _id: string | ObjectId;
  quizActive: any;
  quizCheck: any;
  quiz: Quiz[];
  status: "idle" | "pending" | "succeeded" | "failed";
  error: string | null | undefined;
  msg: string;
}

export default Teacher;
