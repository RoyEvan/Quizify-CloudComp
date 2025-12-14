import { client, database } from "@/lib/mongodb";
import { quizCol } from "@/types/collections/quizCol";
import { studentQuestionCol } from "@/types/collections/studentQuestionCol";
import { ObjectId } from "mongodb";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const getUniqueAccessCode = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);

  const uniqueId = (timestamp + randomStr).substring(0, 16);
  return uniqueId.padEnd(16, '0');
};

const accessCodeExist = async (access_code: string) => {
  // const res = await database
  //   .collection("quizzes")
  //   .find({ access_code, deleted_at: { $exists: true, $eq: null } })
  //   .toArray();
  
  const quizSnap = await quizCol
    .where("access_code", "==", access_code)
    .where("deleted_at", "==", null)
    .get();
  
  const accessCode: string = !quizSnap.empty ? quizSnap.docs[0].data().access_code : null;

  return accessCode.length > 0;
}

// Retrieve Quizzes
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET});
    const teacher_id: string | undefined = token?.user_id?.toString();
    
    // const res = await database
    //   .collection("quizzes")
    //   .find({ teacher_id: new ObjectId(teacher_id), deleted_at: { $exists: true, $eq: null } })
    //   .sort("created_at", -1)
    //   .toArray();
    
    const quizSnaps = await quizCol
      .where("teacher_id", "==", teacher_id!)
      .where("deleted_at", "==", null)
      .orderBy("created_at", "desc")
      .get();
    
    const quizData = quizSnaps.docs.map((doc) => ({
      _id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at.toDate(),
      opened_at: doc.data().opened_at.toDate(),
      ended_at: doc.data().ended_at.toDate(),
      deleted_at: doc.data().deleted_at?.toDate() || null,
    }));
    
    const returnData = await Promise.all(
      quizData.map(async (quiz: any) => {
        return {
          _id: quiz._id,
          title: quiz.title,
          quiz_started: quiz.opened_at,
          quiz_ended: quiz.ended_at,
          access_code: quiz.access_code,
          student_attempt: quiz.student_attempt.length,
          student_joined: quiz.student_joined.length,
          questions: (await quizCol.doc(quiz._id).collection('questions').get()).size,
        }
      })
    );
    
    return NextResponse.json(returnData, { status: 200 });
  }
  catch(err) {
    console.log(err);
  }

  return NextResponse.json("Failed!", { status: 500})
}

// Add New Quiz
export async function POST(req: NextRequest) {
  try {
    const request = await req.json();
    const token = await getToken({req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET});

    const teacher_id: string | undefined = token?.user_id?.toString();
    const title: string = request.title?.toString().trim();
    const opened_at: Date = new Date(request.opened_at?.toString().trim());
    const ended_at: Date = new Date(request.ended_at?.toString().trim());
    let access_code: string = request.access_code?.toString().trim();
    
    // Memastikan semua inputan sudah diisi
    if(!title || !opened_at || !ended_at || !teacher_id) {
      return NextResponse.json("Title, Date Opened and Date Ended must be provided!", { status: 400 });
    }
    else if(!access_code) {
      // Jika access_code tidak diisi, maka akan diisi dengan random string
      access_code = getUniqueAccessCode();
    }
    else if(access_code.length < 8 || access_code.length > 16) {
      // Jika diinputkan, maka pastikan panjang access_code antara 8-16 karakter
      return NextResponse.json("Access Code must be between 8-16 characters", { status: 400 });
    }
    else if (await accessCodeExist(access_code)) {
      // Mengecek apakah access_code sudah digunakan
      return NextResponse.json("Access Code is used", { status: 400 });
    }
    
    // const insert = await database
    //   .collection("quizzes")
    //   .insertOne({
    //     title,
    //     created_at: new Date(),
    //     opened_at,
    //     ended_at,
    //     access_code,
    //     teacher_id: new ObjectId(teacher_id),
    //     student_attempt: [],
    //     student_joined: [],
    //     questions: [],
    //     deleted_at: null,
    //   });

    const newQuiz = {
      title,
      created_at: new Date(),
      opened_at,
      ended_at,
      access_code,
      teacher_id: teacher_id,
      student_attempt: [],
      student_joined: [],
      questions: [],
      deleted_at: null,
    };
    const quiz_id = quizCol.doc().id;
    await quizCol.doc(quiz_id).set(newQuiz);
      
    return NextResponse.json({
      msg: "Quiz successfully added!",
      data: {
        _id: quiz_id,
        title: newQuiz.title,
        quiz_started: newQuiz.opened_at,
        quiz_ended: newQuiz.ended_at,
        access_code: newQuiz.access_code,
        student_attempt: 0,
        student_joined: 0,
        questions: 0,
      }
    }, { status: 200 });
  }
  catch(err) {
    console.log(err);  
  }

  return NextResponse.json("Failed", { status: 500 });
}

// Delete Quiz
export async function DELETE(req: NextRequest) {
  try {
    const token = await getToken({req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET});
    const request = await req.json();
    
    const teacher_id: string | undefined = token?.user_id?.toString();
    const quiz_id: string = request.quiz_id.toString();

    if(!quiz_id) {
      return NextResponse.json("Invalid Quiz ID", { status: 400 });
    }

    // Get the Quiz
    // const quiz = await database
    //   .collection("quizzes")
    //   .findOne({
    //     _id: new ObjectId(quiz_id),
    //     teacher_id: new ObjectId(teacher_id),
    //     deleted_at: { $exists: true, $eq: null }
    //   });
    
    const quizSnap = await quizCol
      .where('quiz_id', '==', quiz_id)
      .where('deleted_at', '==', null)
      .where('teacher_id', '==', teacher_id)
      .get();
    if(quizSnap.empty) {
      return NextResponse.json("Quiz Not Found", { status: 404 });
    }
    const quizData: any = quizSnap.docs[0].exists ? { _id: quizSnap.docs[0].id, ...quizSnap.docs[0].data() } : null;

    if(quizData.student_attempt.length > 0) {
      return NextResponse.json("Quiz has been attempted by students!", { status: 400 });
    }

    const studentQuestionSnaps = await studentQuestionCol.where('quiz_id', '==', quiz_id).get();
    await Promise.all(studentQuestionSnaps.docs.map(async (doc) => {
      await doc.ref.delete();
      return doc;
    }));

    await quizSnap.docs[0].ref.update({ deleted_at: new Date() });
    
    return NextResponse.json({
      msg: "Quiz successfully deleted!",
      data: { quiz_id }
    }, { status: 200 });
  }
  catch(err) {
    console.log(err);    
  }

  return NextResponse.json("Failed", { status: 500 });
}
