import { fileNameToGcpLink } from "@/lib/helper/formatting/image";
import { quizCol } from "@/types/collections/quizCol";
import { studentCol } from "@/types/collections/studentCol";
import { studentQuestionCol } from "@/types/collections/studentQuestionCol";
import { FieldValue } from "firebase-admin/firestore";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, {params}: {params: Promise<{ quiz_id: string, student_id: string }>}) {
  try {
    const token = await getToken({ req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET });
    const teacher_id: string|undefined = token?.user_id?.toString();
    
    const param = await params;
    const quizId: string = param.quiz_id;
    const studentId: string = param.student_id;

    if(!quizId || !studentId) {
      return NextResponse.json(
        "Quiz ID and Student ID must be a valid value!",
        { status: 400 }
      );
    }
    
    const quizSnap = await quizCol.doc(quizId).get();
    if(!quizSnap.exists) {
      return NextResponse.json("Quiz Not Found", { status: 404 });
    }

    const quizData: any ={
      _id: quizSnap.id,
      ...quizSnap.data(),
      created_at: quizSnap.data()!.created_at.toDate(),
      opened_at: quizSnap.data()!.opened_at.toDate(),
      ended_at: quizSnap.data()!.ended_at.toDate(),
      deleted_at: quizSnap.data()!.deleted_at?.toDate() || null,
    };
    
    const quizQuestionSnaps = await quizCol.doc(quizData._id).collection('questions').get();
    quizData.questions = quizQuestionSnaps.docs.map((doc) => {
      return { id: doc.id, ...doc.data() };
    });
    if(!quizData) {
      return NextResponse.json("Quiz Not Found", { status: 404 });
    }
    else if(quizData.teacher_id != teacher_id) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    
    // Make all students submit their quiz
    if(quizData.ended_at < new Date()) {
      const studentSnaps = await studentCol.where('cur_quiz_id', '==', quizId).get();
      const studentData = studentSnaps.docs.map((doc) => {
        return { id: doc.id, ...doc.data() };
      });
      await Promise.all(studentData.map(async (student) => {
        await studentCol.doc(student.id).update({
          cur_quiz_id: "",
          quiz_done: FieldValue.arrayUnion(quizId)
        });
      }));

      const studentQuestionSnaps = await studentQuestionCol.where('quiz_id', '==', quizId).get()
      const studentQuestionData = studentQuestionSnaps.docs.map((doc) => {
        return { id: doc.id, ...doc.data() };
      });
      await Promise.all(studentQuestionData.map(async (sq) => {
        await studentQuestionCol.doc(sq.id).update({
          submit_date: quizData.ended_at
        });
      }));
    }

    const studentQuestionSnaps = await studentQuestionCol
      .where('quiz_id', '==', quizId)
      .where('student_id', '==', studentId)
      .get();

    if(studentQuestionSnaps.empty) {
      return NextResponse.json("Student has not attempted this quiz!", { status: 404 })
    }
    const studentQuestionData: any = {
      _id: studentQuestionSnaps.docs[0].id,
      ...studentQuestionSnaps.docs[0].data(),
      submit_date: studentQuestionSnaps.docs[0].data().submit_date.toDate() || null
    };
    
    if(!studentQuestionData.submit_date) {
      return NextResponse.json("Student has not submitted this quiz!", { status: 404 })
    }

    const questionSnaps = await studentQuestionCol.doc(studentQuestionData?._id).collection('questions').get();
    const questionData: any = questionSnaps.docs.map((doc) => {
      return { id: doc.id, ...doc.data() };
    });

    quizData.questions = await Promise.all(quizData.questions.map(async (question: any) => {
      const answer = questionData.find((ans: any) => ans.question_id == question.id);
      question.answer = answer.answer;
      question.correct_answer = answer.correct_answer;
      question.corrected = true;
      question.points = answer.points;

      question.img = question.img ? await fileNameToGcpLink(question.img) : undefined;
      if(question.type == "pg") {
        question.answers = await Promise.all(
          question.answers.map(async (ans: string) => {
            const extension = ans.split('.');
            if(extension.length > 1 && (ans.endsWith(".jpg") || ans.endsWith(".png"))) {
              return await fileNameToGcpLink(ans);
            }

            return ans;
          })
        );
      }

      return question;
    }));

    const studentSnap = await studentCol.doc(studentId).get();
    const studentData: any = { _id: studentSnap.id, ...studentSnap.data() };

    return NextResponse.json({
      msg: "Success!",
      quiz: quizData.title,
      access_code: quizData.access_code,
      student: studentData.fullname,
      questions: quizData.questions,
      result: {
        corrected: questionData.length,
        score: studentQuestionData.score,
        submitted: studentQuestionData.submit_date,
      }
    }, { status: 200 })
  }
  catch(err) {
    console.log(err);
  }
  
  return NextResponse.json("Failed", { status: 500 })
}

export async function PUT(req: NextRequest, {params}: {params:  Promise<{ quiz_id: string, student_id: string }>}) {
  try {
    const request = await req.json();
    const token = await getToken({ req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET });
    const teacher_id: string|undefined = token?.user_id?.toString();

    const param = await params;
    const quizId: string = param.quiz_id;
    const studentId: string = param.student_id;
    const questions = request.questions;
    
    const quizSnap = await quizCol.doc(quizId).get();
    if(!quizSnap.exists) {
      return NextResponse.json("Quiz Not Found", { status: 404 });
    }

    const quizData: any = {
      _id: quizSnap.id,
      ...quizSnap.data(),
      created_at: quizSnap.data()!.created_at.toDate(),
      opened_at: quizSnap.data()!.opened_at.toDate(),
      ended_at: quizSnap.data()!.ended_at.toDate(),
      deleted_at: quizSnap.data()!.deleted_at?.toDate() || null,
    };
    if(!quizData) {
      return NextResponse.json("Quiz Not Found", { status: 404 });
    }
    
    if(quizData.teacher_id != teacher_id) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const studentQuestionSnap = await studentQuestionCol
      .where('quiz_id', '==', quizId)
      .where('student_id', '==', studentId)
      .get();
    if(!studentQuestionSnap.empty) {
      return NextResponse.json("Student have not attempted to this quiz!", { status: 404 });
    }
    const studentQuestionData: any = {
      _id: studentQuestionSnap.docs[0].id,
      ...studentQuestionSnap.docs[0].data()
    };

    const questionSnaps = await studentQuestionCol.doc(studentQuestionData._id).collection('questions').get();
    const questionData: any = questionSnaps.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    let score = 0;
    const corrections = questions.map((corrected: any) => {      
      // Jawaban Siswa
      const sq_answer = questionData.find((ans: any) => ans.question_id == corrected.id);   
      sq_answer.correct_answer = (corrected.answer_key == corrected.answer);
      sq_answer.corrected = true;
      sq_answer.points = corrected.points;
      score += sq_answer.points;
      return sq_answer;
    });

    await Promise.all(corrections.map(async (corrected: any) => {
      await studentQuestionSnap.docs[0].ref
        .collection('questions')
        .doc(corrected.id)
        .update({
          correct_answer: corrected.correct_answer,
          corrected: true,
          points: corrected.points
        });
    }));
    
    await studentQuestionSnap.docs[0].ref.update({
      score: score,
      corrected: true
    });

    return NextResponse.json({ msg: "Success!" }, { status: 200 });
  }
  catch(err) {
    console.log(err);
  }

  return NextResponse.json("Failed!", { status: 500 })
}