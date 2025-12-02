import { quizCol } from "@/types/collections/quizCol";
import { studentCol } from "@/types/collections/studentCol";
import { studentQuestionCol } from "@/types/collections/studentQuestionCol";
import { FieldValue } from "firebase-admin/firestore";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// Submit Quiz
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET});
    const student_id: string = token!.user_id!.toString();
    
    // Mengecek apakah student_id dan quiz_id sudah diinputkan
    if(!student_id || student_id.trim() == "") {
      return NextResponse.json("Akses tidak terotorisasi!", { status: 400 });
    }

    // MongoDB Code
    // // Ambil students dengan id yang diinputkan
    // const student = await database
    //   .collection("students")
    //   .findOne({
    //     _id: new ObjectId(student_id)
    //   }, {
    //     projection: { cur_quiz_id: 1 }
    //   });

    const studentSnap = await studentCol.doc(student_id).get();
    const studentData: any = { _id: student_id, ...studentSnap.data() };
    
    // Mengecek apakah student_id terdaftar
    if(!studentData) {
      return NextResponse.json("Siswa tidak ditemukan", { status: 404 });
    }
    
    if(!studentData.cur_quiz_id) {
      // Jika student tidak memiliki quiz yang sedang dikerjakan
      return NextResponse.json("Siswa tidak memiliki quiz untuk dikumpulkan!", { status: 400 });
    }
    
    // MongoDB Code
    // // Update student
    // const session = client.startSession();
    // let successSubmit = false;
    // try {
    //   session.startTransaction();
    // 
    //   await database
    //     .collection<Document>("students")
    //     .updateOne({ _id: new ObjectId(student_id) }, {
    //       $set: {
    //         cur_quiz_id: "",
    //       },
    //       $push: {
    //         quiz_done: new ObjectId(student.cur_quiz_id+"")
    //       },
    //       $pull: {
    //         quiz_joined: new ObjectId(student.cur_quiz_id+"")
    //       }
    //     }, { session });
    // 
    //   // Update student_questions
    //   await database
    //     .collection<Document>("student_questions")
    //     .updateMany({ student_id: new ObjectId(student_id), quiz_id: new ObjectId(student.cur_quiz_id+"") }, {
    //       $set: { submit_date: new Date() }
    //     }, { session });
    // 
    //   await session.commitTransaction();
    //   successSubmit = true;
    // }
    // catch(err) {
    //   console.log(err);
    //   await session.abortTransaction();
    // }
    // finally {
    //   session.endSession();
    // }
    // if(!successSubmit) {
    //   return NextResponse.json("Gagal mengumpulkan quiz!", { status: 500 });
    // }

    await studentSnap.ref.update({
      cur_quiz_id: "",
      quiz_done: FieldValue.arrayUnion(studentData.cur_quiz_id),
      quiz_joined: FieldValue.arrayRemove(studentData.cur_quiz_id)
    });

    const studentQuestionSnap = await studentQuestionCol
      .where('student_id', '==', student_id)
      .where('quiz_id', '==', studentData.cur_quiz_id)
      .get();

    studentQuestionSnap.docs[0].ref.update({
      submit_date: FieldValue.serverTimestamp()
    });

    // MongoDB Code
    // const quiz = (await database
    //   .collection("quizzes")
    //   .findOne({
    //     _id: new ObjectId(student.cur_quiz_id+"")
    //   },{
    //     projection: {
    //       title: 1,
    //       opened_at: 1,
    //       ended_at: 1
    //     }
    //   }))!;

    const quizSnap = await quizCol.doc(studentData.cur_quiz_id).get();
    const quizData: any = {
      _id: quizSnap.id,
      ...quizSnap.data(),
      created_at: quizSnap.data()!.created_at.toDate(),
      opened_at: quizSnap.data()!.opened_at.toDate(),
      ended_at: quizSnap.data()!.ended_at.toDate(),
      deleted_at: quizSnap.data()!.deleted_at?.toDate() || null,
    };
    
    return NextResponse.json({
      msg: "Berhasil mengumpulkan quiz!",
      quiz: {
        quiz_id: quizData._id,
        title: quizData.title,
        quiz_started: quizData.opened_at,
        quiz_ended: quizData.ended_at,
      }
    }, { status: 200 });
    
  } catch (err) {
    console.log(err);
  }

  return NextResponse.json("Gagal!", { status: 500 });
}

// Get the history of joined quizzes
export async function GET(req: NextRequest){
  try {
    const token = await getToken({req,secret:process.env.QUIZIFY_NEXTAUTH_SECRET});
    const student_id: string = token!.user_id!.toString();

    // const [quiz] = await database
    //   .collection("students")
    //   .aggregate([
    //     { $match: { _id: new ObjectId(student_id) } },
    //     { $lookup: {
    //       from: "quizzes",
    //       localField: "quiz_joined",
    //       foreignField: "_id",
    //       as: "qj"
    //     }},
    //     { $lookup: {
    //       from: "quizzes",
    //       localField: "quiz_done",
    //       foreignField: "_id",
    //       as: "qd"
    //     }},
    //     { $lookup: {
    //       from: "quizzes",
    //       localField: "cur_quiz_id",
    //       foreignField: "_id",
    //       as: "cq"
    //     }},
    //     { $project: {
    //       qj: 1,
    //       qd: 1,
    //       cur_quiz_id: 1
    //     }},
    //   ])
    //   .toArray();

    const studentSnap = await studentCol.doc(student_id).get();
    const studentData: any = { _id: studentSnap.id, ...studentSnap.data() };

    const quizJoined = studentData.quiz_joined ? await Promise.all(studentData.quiz_joined.map((async (qid: string) => {
      const quizSnap = await quizCol.doc(qid).get();
      return {
        _id: quizSnap.id,
        ...quizSnap.data(),
        created_at: quizSnap.data()!.created_at.toDate(),
        opened_at: quizSnap.data()!.opened_at.toDate(),
        ended_at: quizSnap.data()!.ended_at.toDate(),
        deleted_at: quizSnap.data()!.deleted_at?.toDate() || null,
      };
    }))) : [];
    
    const quizDone = studentData.quiz_done ? await Promise.all(studentData.quiz_done.map((async (qid: string) => {
      const quizSnap = await quizCol.doc(qid).get();
      return {
        _id: quizSnap.id,
        ...quizSnap.data(),
        created_at: quizSnap.data()!.created_at.toDate(),
        opened_at: quizSnap.data()!.opened_at.toDate(),
        ended_at: quizSnap.data()!.ended_at.toDate(),
        deleted_at: quizSnap.data()!.deleted_at?.toDate() || null,
      };
    }))) : [];
    
    const currentQuizSnap = studentData.cur_quiz_id ? await quizCol.doc(studentData.cur_quiz_id).get() : null;
    const currentQuizData: any = currentQuizSnap && currentQuizSnap.exists ? {
      _id: currentQuizSnap.id,
      ...currentQuizSnap.data(),
      created_at: currentQuizSnap.data()!.created_at.toDate(),
      opened_at: currentQuizSnap.data()!.opened_at.toDate(),
      ended_at: currentQuizSnap.data()!.ended_at.toDate(),
      deleted_at: currentQuizSnap.data()!.deleted_at?.toDate() || null,
    } : null;

    const studentQuizzes: any = {
      _id: student_id,
      qj: quizJoined,
      qd: quizDone,
      cq: currentQuizData
    };

    // const sq = await database
    //   .collection("student_questions")
    //   .find({ student_id: new ObjectId(student_id) })
    //   .toArray();
    const studentQuestionSnap = await studentQuestionCol
      .where('student_id', '==', student_id)
      .get();
    if(studentQuestionSnap.empty) {

    }
    const studentQuestionData: any[] = !studentQuestionSnap.empty ? studentQuestionSnap.docs.map(doc => ({ _id: doc.id, ...doc.data() })) : [];
    
    let quiz_attempt = {};
    const quiz_joined = [];

    for(let i=0; i<studentQuizzes.qj.length; i++) {
      const score = studentQuestionData.find(s => s._id === studentQuizzes.qj[i]._id)?.score;
      
      const joined = {
        _id: studentQuizzes.qj[i]._id.toString(),
        title: studentQuizzes.qj[i].title,
        quiz_started: studentQuizzes.qj[i].opened_at,
        quiz_ended: studentQuizzes.qj[i].ended_at,
        score
      }
      
      if(studentQuizzes.cq && joined._id == studentQuizzes.cq._id) {
        quiz_attempt = joined;
      }
      else{
        quiz_joined.push(joined);
      }
    }

    const quiz_done = studentQuizzes.qd.map((q:any) => {
      const score = studentQuestionData.find((s:any) => s.quiz_id.toString() === q._id.toString())?.score;
      
      return {
        _id: q._id.toString(),
        title: q.title,
        quiz_started: q.opened_at,
        quiz_ended: q.ended_at,
        score
      }
    });
    
    return NextResponse.json({  
      _id: student_id,
      quiz_attempt,
      quiz_joined,
      quiz_done
    }, { status: 200 });
  }
  catch (err) {
    console.log(err); 
  }
  return NextResponse.json("Gagal!", { status: 500 });
}