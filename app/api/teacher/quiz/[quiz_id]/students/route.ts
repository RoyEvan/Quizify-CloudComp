import { quizCol } from "@/types/collections/quizCol";
import { studentCol } from "@/types/collections/studentCol";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, {params}: {params: Promise<{quiz_id: string}>}) {
  try {
    const param = await params;
    const quiz_id = param.quiz_id;

    // Ambil list of student_attempt dari database
    // const students = await database
    //   .collection("quizzes")
    //   .aggregate()
    //   .match({ _id: new ObjectId(quiz_id), deleted_at: { $exists: true, $eq: null } })
    //   .lookup({
    //     from: "students",
    //     localField: "student_attempt",
    //     foreignField: "_id",
    //     as: "students"
    //   })
    //   .unwind("$students")
    //   .lookup({
    //     from: "student_questions",
    //     localField: "students._id",
    //     foreignField: "student_id",
    //     as: "students.questions"
    //   })
    //   .toArray();
    
    const quizSnap = await quizCol.doc(quiz_id).get();
    const quizData: any = quizSnap.exists ? { _id: quizSnap.id, ...quizSnap.data() } : null;
    
    const studentRefs = quizData.student_attempt.map((id: string) => studentCol.doc(id));
    const studentSnaps = studentRefs.length > 0 ? await studentCol.firestore.getAll(...studentRefs) : [];
    const studentData = studentSnaps.map(doc => ({ _id: doc.id, ...doc.data() }));

    return NextResponse.json(studentData, { status: 200 });
  }
  catch(err) {
    console.log(err);
  }

  return NextResponse.json("Gagal!", { status: 500 });
}