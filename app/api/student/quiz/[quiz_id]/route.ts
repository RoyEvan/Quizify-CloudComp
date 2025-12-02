import { fileNameToGcpLink } from "@/lib/helper/formatting/image";
import { quizCol } from "@/types/collections/quizCol";
import { studentCol } from "@/types/collections/studentCol";
import { studentQuestionCol } from "@/types/collections/studentQuestionCol";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// GET History per Quiz
export async function GET(req: NextRequest, {params}: {params: {quiz_id: string}}) {
  try {
    const token = await getToken({ req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET });
    const student_id: string | undefined = token?.user_id?.toString();
    const quiz_id: string = params.quiz_id;

    if (!student_id || !quiz_id) {
      return NextResponse.json("Question ID atau Student ID tidak ditemukan!", { status: 400 });
    }

    // const quiz = await database
    //   .collection("quizzes")
    //   .findOne({
    //     _id: new ObjectId(quiz_id),
    //     student_attempt: { $in: [new ObjectId(student_id)] },
    //     deleted_at: { $exists: true, $eq: null }
    //   }, {
    //     projection: {
    //       title: 1,
    //       access_code: 1,
    //       teacher_id: 1,
    //       ended_at: 1,
    //       questions: 1 
    //     }
    //   });

    const quizSnap = await quizCol
      .where('deleted_at', '==', null)
      .where('_id', '==', quiz_id)
      .where('student_attempt', 'array-contains', student_id)
      .get();
    if(!quizSnap.docs[0].exists) {
      return NextResponse.json("Quiz Not Found or student hasn't joined the quiz!", { status: 404 });
    }
    const quizData: any = {
      _id: quizSnap.docs[0].id,
      ...quizSnap.docs[0].data(),
      created_at: quizSnap.docs[0].data().created_at.toDate(),
      opened_at: quizSnap.docs[0].data().opened_at.toDate(),
      ended_at: quizSnap.docs[0].data().ended_at.toDate(),
      deleted_at: quizSnap.docs[0].data().deleted_at?.toDate() || null,
    };

    // const answers = await database
    // .collection("student_questions")
    // .findOne({
    //   quiz_id: new ObjectId(quiz_id),
    //   student_id: new ObjectId(student_id),
    //   submit_date: { $ne: null }
    // });
    const studentQuestionSnap = await studentQuestionCol
      .where("quiz_id", "==", quiz_id)
      .where("student_id", "==", student_id)
      .where("submit_date", "!=", null)
      .get();
    if(!studentQuestionSnap.docs[0].exists) {
      return NextResponse.json("Student has not submitted this quiz!", { status: 404 })
    }

    const studentQuestionData: any = {_id: studentQuestionSnap.docs[0].id, ...studentQuestionSnap.docs[0].data()};
    if(!studentQuestionData.corrected) {
      return NextResponse.json("Student answers has not been corrected for this quiz!", { status: 404 });
    }

    // MongoDB Code
    // const student = (await database
    //   .collection("students")
    //   .findOne({ _id: new ObjectId(student_id) }, { projection: { fullname: 1 } }))!;

    const studentSnap = await studentCol.doc(student_id).get();
    const studentData = { _id: studentSnap.id, fullname: studentSnap.data()!.fullname };

    const questionSnaps = await quizSnap.docs[0].ref.collection('questions').get();
    quizData.questions = questionSnaps.docs.map((doc) => ({
      _id: doc.id,
      ...doc.data(),
    }));

    quizData.questions = await Promise.all(quizData.questions.map(async (question: any) => {
      const answer = studentQuestionData.questions.find((ans: any) => ans.question_id.toString() == question.id.toString());
      question.answer = answer.answer;
      question.correct_answer = answer.correct_answer;
      question.corrected = answer.corrected;

      question.img = question.img ? await fileNameToGcpLink(question.img) : undefined;
      if(question.type == "pg") {
        question.answers = await Promise.all(
          question.answers.map(async (ans: string) => {
            return ans.endsWith(".jpg") || ans.endsWith(".png") ? await fileNameToGcpLink(ans) : ans;
          })
        );
      }
      
      return question;
    }));
    
    return NextResponse.json({
      msg: "Success!",
      quiz: quizData.title,
      access_code: quizData.access_code,
      student: studentData.fullname,
      questions: quizData.questions,
      score: studentQuestionData.score,
      submitted: studentQuestionData.submit_date
    }, { status: 200 })
  }
  catch(err) {
    console.log(err);
  }

  return NextResponse.json("Failed!", { status: 500 });
}