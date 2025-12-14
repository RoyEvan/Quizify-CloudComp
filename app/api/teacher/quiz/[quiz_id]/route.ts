import { fileNameToGcpLink } from "@/lib/helper/formatting/image";
import { quizCol } from "@/types/collections/quizCol";
import { studentCol } from "@/types/collections/studentCol";
import { studentQuestionCol } from "@/types/collections/studentQuestionCol";
import Questions from "@/types/question";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// Get Detail Quiz
export async function GET(req: NextRequest, {params}: {params: {quiz_id: string}}) {
  try {
    const token = await getToken({req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET});
    const teacher_id: string|undefined = token?.user_id?.toString();
    
    // expected value from params
    const quiz_id: string = params.quiz_id!;

    // Mengecek apakah student_id dan quiz_id sudah diinputkan
    if(!quiz_id.trim()) {
      return NextResponse.json("Quiz ID and Teacher ID must be a valid value!", { status: 400 });
    }
    
    // Ambil quiz dari database
    // const quiz = await database
    //   .collection("quizzes")
    //   .findOne({
    //     _id: new ObjectId(quiz_id), deleted_at: { $exists: true, $eq: null }
    //   }, {
    //     projection: {
    //       created_at: 0,
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
    else if (quizData.teacher_id !== teacher_id) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    // Mengubah jawaban dan soal yang berupa nama gambar menjadi URL
    quizData.questions = await Promise.all(quizData.questions.map(async (q: Questions) => {
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
            
            return await fileNameToGcpLink(Key);
          }
          return Key;
        }));
      }

      if(q.img) {
        q.img = await fileNameToGcpLink(q.img);
      }

      return q;
    }));
    
    // Jika soal sudah ada, maka kembalikan soal dan waktu sisa ke client
    if(quizData) {
      // const students = await database
      //   .collection("students")
      //   .aggregate([{
      //     $lookup: {
      //       from: "student_questions",
      //       localField: "_id",
      //       foreignField: "student_id",
      //       as: "quiz_done"
      //     }
      //   }, {
      //     $match: {
      //       _id: { $in: quiz.student_attempt },
      //     }
      //   }, {
      //     $addFields: {
      //       quiz_done: {
      //         $filter: {
      //           input: "$quiz_done",
      //           as: "quiz",
      //           cond: { $eq: ["$$quiz.quiz_id", new ObjectId(quiz_id)] }
      //         }
      //       }
      //     }
      //   }, {
      //     $project: {
      //       fullname: 1,
      //       quiz_done: 1,
      //     }
      //   }
      // ])
      // .toArray();
      
      const studentQuestionSnaps = await studentQuestionCol
        .where("quiz_id", "==", quiz_id)
        .where("submit_date", "!=", null)
        .get();
      const studentQuestionData: any[] = studentQuestionSnaps.docs.map((doc) => ({ _id: doc.id, ...doc.data() }));
      const studentRefs = studentQuestionData.map(({student_id}) => studentCol.doc(student_id));
      const studentSnaps = await studentCol.firestore.getAll(...studentRefs);
      const studentsData: any[] = studentSnaps.map(doc => ({ _id: doc.id, ...doc.data() }));
        
      const students_submitted = (studentsData.length < 0) ? [] :
        studentsData
        .map((s) => {
          s.quiz_done = s.quiz_done.length > 0 ? s.quiz_done[0].score : 0;
          
          return {
            _id: s._id,
            fullname: s.fullname,
            score: s.quiz_done,
          }
        });

      return NextResponse.json({
        _id: quizData._id,
        title: quizData.title,
        quiz_started: quizData.opened_at,
        quiz_ended: quizData.ended_at,
        access_code: quizData.access_code,
        questions: quizData.questions,
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