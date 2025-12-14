import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { quizCol } from "@/types/collections/quizCol";
import { studentCol } from "@/types/collections/studentCol";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  const request = await req.json();
  try {
    const token = await getToken({req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET});
    const student_id: string|undefined = token?.user_id?.toString();

    const access_code: string = request.access_code;
  
    if(!access_code || (access_code.length<8 || access_code.length>16) || !student_id) {
      return NextResponse.json("Access Code and Student ID must be a valid value!",{ status: 400 });
    }
    
    // MongoDB Code
    // const quiz = await database
    //   .collection("quizzes")
    //   .findOne(
    //     { access_code, deleted_at: { $exists: true, $eq: null } },
    //     { 
    //       projection: {
    //         student_joined: 1,
    //         student_attempt: 1,
    //         title: 1,
    //         questions: 1,
    //         opened_at: 1,
    //         ended_at: 1
    //       }
    //     }
    //   );
    
    const quizSnap = await quizCol.where('access_code', '==', access_code).get();
    if(!quizSnap.docs[0]) {
      return NextResponse.json("Quiz not found!", { status: 404 });
    }
    else if(quizSnap.docs[0].data().deleted_at) {
      return NextResponse.json("Quiz has been deleted!", { status: 404 });
    }

    const questionsSnap = await quizSnap.docs[0].ref.collection('questions').get();
    if(questionsSnap.empty) {
      return NextResponse.json("Quiz has no questions!", { status: 403 });
    }
    
    const quizData: any = {
      _id: quizSnap.docs[0].id,
      ...quizSnap.docs[0].data(),
      created_at: quizSnap.docs[0].data().created_at.toDate(),
      opened_at: quizSnap.docs[0].data().opened_at.toDate(),
      ended_at: quizSnap.docs[0].data().ended_at.toDate(),
      deleted_at: quizSnap.docs[0].data().deleted_at?.toDate() || null,
      questions: questionsSnap.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      }))
    };
    

    if(quizData.ended_at < new Date()) {    
      return NextResponse.json("Quiz has ended!", { status: 410 });
    }
    else if (quizData.questions.length === 0) {
      return NextResponse.json("Quiz has no questions!", { status: 403 });
    }
    else if(quizData.deleted_at) {
      return NextResponse.json("Quiz has been deleted!", { status: 404 });
    }


    const hasAttempted = quizData.student_attempt.find((sid: string) => sid == student_id);
    const hasJoined = quizData.student_joined.find((sid: string) => sid == student_id);
    if(!hasJoined && !hasAttempted) {
      // MongoDB Code
      // const session = client.startSession();
      // try {
      //   session.startTransaction();
      //   const joinQuiz = await database
      //     .collection<Document>("quizzes")
      //     .findOneAndUpdate({ access_code, deleted_at: { $exists: true, $eq: null } }, {
      //       $push: { student_joined: new ObjectId(student_id) }
      //     },  {
      //       projection: {
      //         _id: 1,
      //         opened_at: 1,
      //         ended_at: 1
      //       },
      //       session
      //     });
      // 
      //   if(!joinQuiz) {
      //     return NextResponse.json("Quiz not found!", { status: 404 });
      //   }        
      // 
      //   // const updateStudent = await database
      //   await database
      //     .collection<Document>("students")
      //     .updateOne({ _id: new ObjectId(student_id) }, {
      //       $push: { quiz_joined: joinQuiz._id }
      //     }, { session });
      //     await session.commitTransaction();
      // }
      // catch(err: any) {
      //   await session.abortTransaction();
        
      //   return NextResponse.json(err.message, { status: 404 });
      // }
      // finally {
      //   session.endSession();
      // }

      quizSnap.docs[0].ref.update({ student_joined: FieldValue.arrayUnion(student_id) });
      studentCol.doc(student_id).update({ quiz_joined: FieldValue.arrayUnion(quizData._id) });
    }
    else {
      return NextResponse.json("Student already joined!", { status: 409 });
    }

    return NextResponse.json({
      msg: "Quiz successfully joined!",
      data: {
        quiz_id: quizData._id,
        title: quizData.title,
        quiz_started: quizData.opened_at,
        quiz_ended: quizData.ended_at
      }
    }, { status: 200 });
  }
  catch (err) {
    console.log(err);
    
    return NextResponse.json("Failed!", { status: 500 });
  }
}