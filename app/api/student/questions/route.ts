import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { studentCol } from "@/types/collections/studentCol";
import { quizCol } from "@/types/collections/quizCol";
import { studentQuestionCol } from "@/types/collections/studentQuestionCol";
import { FieldValue } from "firebase-admin/firestore";

// Update Answer
export async function PUT(req: NextRequest) {
  try {
    const request = await req.json();
    const token = await getToken({req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET});
    const student_id: string = token!.user_id!.toString();
    const question_id: string = request.question_id.trim();
    const new_answer: string = request.new_answer.trim();

    if(!question_id) {  
      return NextResponse.json("Question ID tidak ditemukan!", { status: 400 })
    }

    // Firestore conversion
    let quiz: any = null;
    const studentSnap = await studentCol.doc(student_id).get();
    const studentData = studentSnap.data()!;
    if (!studentData.cur_quiz_id) {
      return NextResponse.json("Tidak ada quiz yang sedang dikerjakan!", { status: 404 });
    }

    const quizSnap = await quizCol.doc(studentData.cur_quiz_id).get();
    if (!quizSnap.exists) {
      return NextResponse.json("Quiz tidak ditemukan", { status: 404 });
    }

    quiz = {
      _id: quizSnap.id,
      ...quizSnap.data(),
      created_at: quizSnap.data()!.created_at.toDate(),
      opened_at: quizSnap.data()!.opened_at.toDate(),
      ended_at: quizSnap.data()!.ended_at.toDate(),
      deleted_at: quizSnap.data()!.deleted_at?.toDate() || null,
    };
    const quiz_id: string = quiz._id;    
    const currentTime = new Date();
    const quizNotAvailable = currentTime < quiz.opened_at || quiz.ended_at < currentTime;
    if(quizNotAvailable) {
      return NextResponse.json("Quiz tidak tersedia!", { status: 403 });
    }
    
    // Jika student masih mengerjakan quiz, cek waktu quiz yang sedang dikerjakan
    // Jika waktu quiz yang sedang dikerjakan sudah berakhir, maka submit paksa quiz sekarang dan student bisa mengerjakan quiz yang baru
    const studentQuestionSnap = await studentQuestionCol
      .where('student_id', '==', student_id)
      .where('quiz_id', '==', quiz_id)
      .get();
    if(quiz.ended_at < currentTime) {
      await studentCol.doc(student_id).update({
        cur_quiz_id: "",
        quiz_done: FieldValue.arrayUnion(quiz_id),
        quiz_joined: FieldValue.arrayRemove(quiz_id)
      });

      await studentQuestionSnap.docs[0].ref.update({
        submit_date: quiz.ended_at
      });

      return NextResponse.json("Waktu mengerjakan quiz telah berakhir, jawaban tidak dapat diubah!", { status: 403 });
    }

    await studentQuestionSnap.docs[0].ref
      .collection('questions')
      .doc(question_id)
      .update({
        answer: new_answer,
        answered: (new_answer == "" || new_answer.length <= 0) ? 0 : 1
      });

    return NextResponse.json({
      msg: "Berhasil mengubah jawaban!",
      data: {
        question_id,
        answer: new_answer,
        answered: (new_answer == "" || new_answer.length <= 0) ? 0 : 1
      }
    }, { status: 200 });
  }
  catch(err) {
    console.log(err.message);
  }

  return NextResponse.json("Gagal!", { status: 500 });
}

// Update Status
export async function PATCH(req: NextRequest) {
  const request = await req.json();
  try {
    const token = await getToken({req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET});
    const student_id: string|undefined = token?.user_id?.toString();

    const question_id: string = request.question_id;
      
    // if(!question_id || !quiz_id || !student_id) {  
    if(!question_id || !student_id) {  
      return NextResponse.json("Question ID atau Student ID tidak ditemukan!", { status: 400 })
    }

    const studentSnap = await studentCol.doc(student_id).get();
    const studentData = studentSnap.data()!;
    const quiz_id: string = studentData.cur_quiz_id;
    if(!quiz_id) {
      return NextResponse.json("Siswa belum mengerjakan quiz!", { status: 404 });
    }

    const studentQuestionSnap = await studentQuestionCol
      .where('student_id', '==', student_id)
      .where('quiz_id', '==', quiz_id)
      .get();
    if(studentQuestionSnap.docs.length <= 0) {
      return NextResponse.json("Siswa belum mengerjakan quiz!", { status: 404 });
    }

    const questionSnap = await studentQuestionSnap.docs[0].ref
      .collection('questions')
      .doc(question_id)
      .get();
    if(!questionSnap.exists) {
      return NextResponse.json("Pertanyaan tidak ditemukan!", { status: 404 });
    }

    const current_question: any = {
      _id: questionSnap.id,
      ...questionSnap.data()
    };
    const status = current_question.answered;
    const answer = current_question.answer.toString().trim();

    const newAnsweredStatus = (status === 0 || status === 1) ? 2 : (answer.length > 0) ? 1 : 0;
    await questionSnap.ref.update({ answered: newAnsweredStatus });
    
    return NextResponse.json({
      msg: "Berhasil mengubah status!",
      data: {
        question_id: question_id,
        answered: newAnsweredStatus
      }
    }, { status: 200 });
  }
  catch(err) {
    console.log(err);
  }

  return NextResponse.json("Gagal!", { status: 500 });
}