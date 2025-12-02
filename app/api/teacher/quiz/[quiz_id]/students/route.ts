import { database } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, {params}: {params: {quiz_id: string}}) {
  try {
    const { quiz_id } = params;

    // Ambil list of student_attempt dari database
    const students = await database
      .collection("quizzes")
      .aggregate()
      .match({ _id: new ObjectId(quiz_id), deleted_at: { $exists: true, $eq: null } })
      .lookup({
        from: "students",
        localField: "student_attempt",
        foreignField: "_id",
        as: "students"
      })
      .unwind("$students")
      .lookup({
        from: "student_questions",
        localField: "students._id",
        foreignField: "student_id",
        as: "students.questions"
      })
      .toArray();

    return NextResponse.json(students, { status: 200 });
  }
  catch(err) {
    console.log(err);
    
    return NextResponse.json("Gagal!", { status: 500 });
  }
}