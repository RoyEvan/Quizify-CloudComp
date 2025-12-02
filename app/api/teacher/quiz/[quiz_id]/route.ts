import { fileNameToAwsLink1 } from "@/lib/helper/formatting/image";
import { database } from "@/lib/mongodb";
import Questions from "@/types/question";
import { ObjectId } from "mongodb";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// Get Detail Quiz
export async function GET(req: NextRequest, {params}: {params: {quiz_id: string}}) {
  try {
    const token = await getToken({req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET});
    const teacher_id: string|undefined = token?.user_id?.toString();
    // const teacher_id: string|undefined = "67222a3ba3afc3a8672a198b";
    // const teacher_id: string|undefined = "67232fccfd6e9633cc4e297b";
    
    // expected value from params
    const quiz_id: string = params.quiz_id!;

    // Mengecek apakah student_id dan quiz_id sudah diinputkan
    if(!quiz_id || quiz_id.trim().length!=24 || !teacher_id || teacher_id.trim().length != 24) {
      return NextResponse.json("Quiz ID and Teacher ID must be a valid value!", { status: 400 });
    }
    
    // Ambil quiz dari database
    const quiz = await database
      .collection("quizzes")
      .findOne({
        _id: new ObjectId(quiz_id), deleted_at: { $exists: true, $eq: null }
      }, {
        projection: {
          created_at: 0,
        }
      });
    if(!quiz) {
      return NextResponse.json("Quiz Not Found", { status: 404 });
    }
    else if (quiz.teacher_id.toString() !== teacher_id) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    // Mengubah jawaban dan soal yang berupa nama gambar menjadi URL
    quiz.questions = await Promise.all(quiz.questions.map(async (q: Questions) => {
      if(q.type == "pg" && q.answers) {
        q.answers = await Promise.all(q.answers!.map(async (Key:any) => {
          if(Key.toString().split("_").length === 4) {
            const quiz_id = Key.split("_")[0].length === 24 ? true : false;
            const question_id = Key.split("_")[1].length === 24 ? true : false;
            const answer = Key.split("_")[2] === "answer" ? true : false;
            const trailing = Key.split("_")[3];
            const ext = trailing.split(".")[1];

            if(!quiz_id || !question_id || !answer || (ext !== "jpg" && ext !== "png")) {
            }
            
            return await fileNameToAwsLink1(Key);
          }
          return Key;
        }));
      }

      if(q.img) {
        q.img = await fileNameToAwsLink1(q.img);
      }

      return q;
    }));
    
    // Jika soal sudah ada, maka kembalikan soal dan waktu sisa ke client
    if(quiz) {
      const students = await database
        .collection("students")
        .aggregate([{
          $lookup: {
            from: "student_questions",
            localField: "_id",
            foreignField: "student_id",
            as: "quiz_done"
          }
        }, {
          $match: {
            _id: { $in: quiz.student_attempt },
          }
        }, {
          $addFields: {
            quiz_done: {
              $filter: {
                input: "$quiz_done",
                as: "quiz",
                cond: { $eq: ["$$quiz.quiz_id", new ObjectId(quiz_id)] }
              }
            }
          }
        }, {
          $project: {
            fullname: 1,
            quiz_done: 1,
          }
        }
      ])
      .toArray();
      
        
      const students_submitted = (students.length < 0) ? [] :
        students
        .map((s) => {
          s.quiz_done = s.quiz_done.length > 0 ? s.quiz_done[0].score : 0;
          
          return {
            _id: s._id.toString(),
            fullname: s.fullname,
            score: s.quiz_done,
          }
        });

      return NextResponse.json({
        _id: quiz._id.toString(),
        title: quiz.title,
        quiz_started: quiz.opened_at,
        quiz_ended: quiz.ended_at,
        access_code: quiz.access_code,
        questions: quiz.questions,
        students_submitted,
      }, { status: 200 });
    }
    else {
      return NextResponse.json("Quiz Not Found", { status: 404 });
    }
  }
  catch(err) {
    console.log(err);
    
    return NextResponse.json("Failed", { status: 500 });
  }
}

// Correct Student Answer
export async function POST(req: NextRequest, {params}: {params: {quiz_id: string}}) {
  const request = await req.json();
  try {
    const quiz_id: string = params.quiz_id!;
    const student_id: string = request.student_id!;

    return NextResponse.json({quiz_id, student_id}, { status: 200 });
    
  }
  catch(err){
    console.log(err);
    
    return NextResponse.json("Failed", { status: 500 });
  }
}