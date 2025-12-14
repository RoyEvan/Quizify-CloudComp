import { fileNameToGcpLink } from "@/lib/helper/formatting/image";
import { quizCol } from "@/types/collections/quizCol";
import { studentCol } from "@/types/collections/studentCol";
import { studentQuestionCol } from "@/types/collections/studentQuestionCol";
import { FieldValue } from "firebase-admin/firestore";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, {params}: {params: { quiz_id: string, student_id: string }}) {
  try {
    const token = await getToken({ req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET });
    const teacher_id: string|undefined = token?.user_id?.toString();
    
    const quiz_id: string = params.quiz_id.trim();
    const student_id: string = params.student_id.trim();
    if(quiz_id.length != 24 || student_id.length != 24) {
      return NextResponse.json(
        "Quiz ID and Student ID must be a valid value!",
        { status: 400 }
      );
    }

    // const quiz = await database
    //   .collection("quizzes")
    //   .findOne({
    //     _id: new ObjectId(quiz_id),
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
      .where('quiz_id', '==',quiz_id)
      .where('deleted_at', '==', null)
      .get();
    if(quizSnap.empty) {
      return NextResponse.json("Quiz Not Found", { status: 404 });
    }

    const quizData: any = !quizSnap.empty ? {
      _id: quizSnap.docs[0].id,
      ...quizSnap.docs[0].data(),
      created_at: quizSnap.docs[0].data().created_at.toDate(),
      opened_at: quizSnap.docs[0].data().opened_at.toDate(),
      ended_at: quizSnap.docs[0].data().ended_at.toDate(),
      deleted_at: quizSnap.docs[0].data().deleted_at?.toDate() || null,
    } : null;
    
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
      // await database
      //   .collection<Document>("students")
      //   .updateMany({ cur_quiz_id: quiz_id }, {
      //     $set: { cur_quiz_id: "" },
      //     $push: { quiz_done: new ObjectId(quiz_id) }
      //   });

      // await database
      //   .collection<Document>("student_questions")
      //   .updateMany({ quiz_id, submit_date: null }, {
      //     $set: { submit_date: new Date() }
      //   });
      
      const studentSnaps = await studentCol
        .where('cur_quiz_id', '==', quiz_id)
        .get();
      const studentData = studentSnaps.docs.map((doc) => {
        return { id: doc.id, ...doc.data() };
      });
      await Promise.all(studentData.map(async (student) => {
        await studentCol.doc(student.id).update({
          cur_quiz_id: "",
          quiz_done: FieldValue.arrayUnion(quiz_id)
        });
      }));

      const studentQuestionSnaps = await studentQuestionCol
        .where('quiz_id', '==', quiz_id)
        .where('submit_date', '==', null)
        .get()
      const studentQuestionData = studentQuestionSnaps.docs.map((doc) => {
        return { id: doc.id, ...doc.data() };
      });
      await Promise.all(studentQuestionData.map(async (sq) => {
        await studentQuestionCol.doc(sq.id).update({
          submit_date: quizData.ended_at
        });
      }));
    }

    // const answers = await database
    //   .collection("student_questions")
    //   .findOne({
    //     quiz_id: new ObjectId(quiz_id),
    //     student_id: new ObjectId(student_id),
    //     submit_date: { $ne: null }
    //   });
    const studentQuestionSnaps = await studentQuestionCol
      .where('quiz_id', '==', quiz_id)
      .where('student_id', '==', student_id)
      .where('submit_date', '!=', null)
      .get();
    const studentQuestionData: any = !studentQuestionSnaps.empty ? {
      _id: studentQuestionSnaps.docs[0].id,
      ...studentQuestionSnaps.docs[0].data()
    } : null;

    const questionSnaps = await studentQuestionCol.doc(studentQuestionData?._id).collection('questions').get();
    const questionData: any = questionSnaps.docs.map((doc) => {
      return { id: doc.id, ...doc.data() };
    });
    
    // student = (await database
    //   .collection("students")
    //   .findOne({ _id: new ObjectId(student_id) }, { projection: { fullname: 1 } }))!;
    
    // Begin the auto-correction process
    const pointsPerQuestion: number = 100 / quizData.questions.length;
    let score = 0;
    let corrected: number = 0;


    studentQuestionData.questions = questionData.map((ans: any) => {
      const question = quizData.questions.find((question: any) => question.id == ans.question_id);
      
      if(question.type == "pg" && !studentQuestionData.corrected) {
        ans.correct_answer = parseInt(question.answer_key) === parseInt(ans.answer) ? pointsPerQuestion : 0;
        ans.corrected = true;
        score += ans.correct_answer;
      }

      if(ans.corrected) {
        corrected++;
      }
      return ans;
    });
    

    quizData.questions = await Promise.all(quizData.questions.map(async (question: any) => {
      const answer = studentQuestionData.questions.find((ans: any) => ans.question_id.toString() == question.id.toString());
      question.answer = answer.answer;
      question.correct_answer = answer.correct_answer;
      question.corrected = answer.corrected;

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

    const studentSnap = await studentCol.doc(student_id).get();
    const studentData: any = { _id: studentSnap.id, ...studentSnap.data() };

    return NextResponse.json({
      msg: "Success!",
      quiz: quizData.title,
      access_code: quizData.access_code,
      student: studentData.fullname,
      questions: quizData.questions,
      result: {
        corrected,
        score: studentQuestionData.corrected ? studentQuestionData.score : score,
        submitted: studentQuestionData.submit_date.toDate(),
      }
    }, { status: 200 })
  }
  catch(err) {
    console.log(err);
  }
  
  return NextResponse.json("Failed", { status: 500 })
}

export async function PUT(req: NextRequest, {params}: {params: { quiz_id: string, student_id: string }}) {
  try {
    const request = await req.json();
    const token = await getToken({ req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET });
    const teacher_id: string|undefined = token?.user_id?.toString();

    const quiz_id: string = params.quiz_id.trim();
    const student_id: string = params.student_id.trim();
    const questions = request.questions;
    const result = request.result;

    // const quiz = await database
    //   .collection("quizzes")
    //   .findOne({ _id: new ObjectId(quiz_id), deleted_at: { $exists: true, $eq: null } });
    
    const quizSnap = await quizCol
      .where('quiz_id', '==',quiz_id)
      .where('deleted_at', '==', null)
      .get();
    if(quizSnap.empty) {
      return NextResponse.json("Quiz Not Found", { status: 404 });
    }

    const quizData: any = !quizSnap.empty ? {
      _id: quizSnap.docs[0].id,
      ...quizSnap.docs[0].data(),
      created_at: quizSnap.docs[0].data().created_at.toDate(),
      opened_at: quizSnap.docs[0].data().opened_at.toDate(),
      ended_at: quizSnap.docs[0].data().ended_at.toDate(),
      deleted_at: quizSnap.docs[0].data().deleted_at?.toDate() || null,
    } : null;
    if(!quizData) {
      return NextResponse.json("Quiz Not Found", { status: 404 });
    }
    else if(quizData.teacher_id != teacher_id) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    // const sq = await database
    //   .collection("student_questions")
    //   .findOne({ quiz_id: new ObjectId(quiz_id), student_id: new ObjectId(student_id) });

    const studentQuestionSnap = await studentQuestionCol
      .where('quiz_id', '==', quiz_id)
      .where('student_id', '==', student_id)
      .get();
    const studentQuestionData: any = !studentQuestionSnap.empty ? {
      _id: studentQuestionSnap.docs[0].id,
      ...studentQuestionSnap.docs[0].data()
    } : null;
    if(!studentQuestionData) {
      return NextResponse.json("Student have not attempted to this quiz!", { status: 404 });
    }

    const questionSnaps = await studentQuestionCol.doc(studentQuestionData?._id).collection('questions').get();
    const questionData: any = questionSnaps.docs.map((doc) => {
      return { id: doc.id, ...doc.data() };
    });
    
    questions.map((corrected: any) => {
      const sq_answer = questionData.find((ans: any) => ans.question_id == corrected.id);
      
      sq_answer.correct_answer = corrected.correct_answer;
      sq_answer.corrected = corrected.corrected;
    });
    

    // const session = client.startSession();
    // let successCorrecting = false;
    // try {
    //   session.startTransaction();
    //   await database
    //   .collection("student_questions")
    //   .updateMany({ quiz_id: new ObjectId(quiz_id), student_id: new ObjectId(student_id),  }, {
    //     $set: { questions: sq.questions, score: result.score, corrected: true }
    //   }, { session });
    //   await session.commitTransaction();
    //   successCorrecting = true;
    // }
    // catch(err) {
    //   console.log(err);
    //   await session.abortTransaction();
    // }
    // finally {
    //   session.endSession();
    // }
    // 
    // if(successCorrecting) {
    //   return NextResponse.json({ msg: "Success!" }, { status: 200 });
    // }

    await Promise.all(questions.map(async (corrected: any) => {
      await studentQuestionSnap.docs[0].ref
        .collection('questions')
        .doc(corrected.id)
        .update({
          correct_answer: corrected.correct_answer,
          corrected: corrected.corrected
        });
    }));

    await studentQuestionSnap.docs[0].ref.update({
      score: result.score,
      corrected: true
    });

    return NextResponse.json({ msg: "Success!" }, { status: 200 });
  }
  catch(err) {
    console.log(err);
  }

  return NextResponse.json("Failed!", { status: 500 })
}