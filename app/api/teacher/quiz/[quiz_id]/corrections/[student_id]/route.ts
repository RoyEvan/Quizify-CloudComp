import { fileNameToAwsLink1 } from "@/lib/helper/formatting/image";
import { client, database } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
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

    const quiz = await database
      .collection("quizzes")
      .findOne({ _id: new ObjectId(quiz_id), deleted_at: { $exists: true, $eq: null } }, {projection: { title: 1, access_code: 1, teacher_id: 1, ended_at: 1, questions: 1 }});
    if(!quiz) {
      return NextResponse.json("Quiz Not Found", { status: 404 });
    }
    else if(quiz.teacher_id.toString() != teacher_id) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    
    // Make all students submit their quiz
    if(quiz.ended_at < new Date()) {
      await database
        .collection<Document>("students")
        .updateMany({ cur_quiz_id: quiz_id }, {
          $set: { cur_quiz_id: "" },
          $push: { quiz_done: new ObjectId(quiz_id) }
        });

      await database
        .collection<Document>("student_questions")
        .updateMany({ quiz_id, submit_date: null }, {
          $set: { submit_date: new Date() }
        });
    }

    let student;
    const answers = await database
      .collection("student_questions")
      .findOne({
        quiz_id: new ObjectId(quiz_id),
        student_id: new ObjectId(student_id),
        submit_date: { $ne: null }
      });
    if(!answers) {
      return NextResponse.json("Student has not submitted this quiz!", { status: 404 })
    }
    student = (await database
      .collection("students")
      .findOne({ _id: new ObjectId(student_id) }, { projection: { fullname: 1 } }))!;

    
    // Begin the auto-correction process
    const pointsPerQuestion: number = 100 / quiz.questions.length;
    let score = 0;
    let corrected: number = 0;


    answers.questions = answers.questions.map((ans: any) => {
      const question = quiz.questions.find((question: any) => question.id.toString() == ans.question_id.toString());
      
      if(question.type == "pg" && !answers.corrected) {
        ans.correct_answer = parseInt(question.answer_key) === parseInt(ans.answer) ? pointsPerQuestion : 0;
        ans.corrected = true;
        
        score += ans.correct_answer;
      }

      if(ans.corrected) {
        corrected++;
      }
      return ans;
    });
    

    quiz.questions = await Promise.all(quiz.questions.map(async (question: any) => {
      const answer = answers.questions.find((ans: any) => ans.question_id.toString() == question.id.toString());
      question.answer = answer.answer;
      question.correct_answer = answer.correct_answer;
      question.corrected = answer.corrected;

      question.img = question.img ? await fileNameToAwsLink1(question.img) : undefined;
      if(question.type == "pg") {
        question.answers = await Promise.all(
          question.answers.map(async (ans: string) => {
            return ans.endsWith(".jpg") || ans.endsWith(".png") ? await fileNameToAwsLink1(ans) : ans
          })
        );
      }

      return question;
    }));

    return NextResponse.json({
      msg: "Success!",
      quiz: quiz.title,
      access_code: quiz.access_code,
      student: student.fullname,
      questions: quiz.questions,
      result: {
        corrected,
        score: answers.corrected ? answers.score : score,
        submitted: answers.submit_date
      }
    }, { status: 200 })
  }
  catch(err) {
    console.log(err);

    return NextResponse.json("Failed", { status: 500 })
  }

}

export async function PUT(req: NextRequest, {params}: {params: { quiz_id: string, student_id: string }}) {
  const request = await req.json();
  try {
    const token = await getToken({ req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET });
    const teacher_id: string|undefined = token?.user_id?.toString();
    // const teacher_id: string|undefined = "67222a3ba3afc3a8672a198b";
    // const teacher_id: string|undefined = "67232fccfd6e9633cc4e297b";

    const quiz_id: string = params.quiz_id.trim();
    const student_id: string = params.student_id.trim();
    const questions = request.questions;
    const result = request.result;
    

    const quiz = await database
      .collection("quizzes")
      .findOne({ _id: new ObjectId(quiz_id), deleted_at: { $exists: true, $eq: null } });
    if(!quiz) {
      return NextResponse.json("Quiz Not Found", { status: 404 });
    }
    else if(quiz.teacher_id.toString() != teacher_id) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const sq = await database
      .collection("student_questions")
      .findOne({ quiz_id: new ObjectId(quiz_id), student_id: new ObjectId(student_id) });
    if(!sq) {
      return NextResponse.json("Student have not attempted to this quiz!", { status: 404 });
    }
    
    questions.map((corrected: any) => {
      const sq_answer = sq.questions.find((ans: any) => ans.question_id.toString() == corrected.id.toString());
      
      sq_answer.correct_answer = corrected.correct_answer;
      sq_answer.corrected = corrected.corrected;
    });
    

    const session = client.startSession();
    let successCorrecting = false;
    try {
      session.startTransaction();
      await database
      .collection("student_questions")
      .updateMany({ quiz_id: new ObjectId(quiz_id), student_id: new ObjectId(student_id),  }, {
        $set: { questions: sq.questions, score: result.score, corrected: true }
      }, { session });

      await session.commitTransaction();
      successCorrecting = true;
    }
    catch(err) {
      console.log(err);
      
      await session.abortTransaction();
    }
    finally {
      session.endSession();
    }

    if(successCorrecting) {
      return NextResponse.json({ msg: "Success!" }, { status: 200 });
    }
    else {
      return NextResponse.json("Failed!", { status: 500 });
    }  
  }
  catch(err) {

    console.log(err);
    
    return NextResponse.json("Failed!", { status: 500 })
  }
}
