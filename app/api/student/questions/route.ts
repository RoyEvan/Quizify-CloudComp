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
    const question_id: string = request.question_id.toString().trim();
    const new_answer: string = request.new_answer.toString().trim();

    if(!question_id) {  
      return NextResponse.json("Question ID tidak ditemukan!", { status: 400 })
    }

    // // MongoDB Code
    // // Get current quiz of student with id = student_id
    // let [quiz] = await database
    //   .collection("students")
    //   .aggregate([{
    //     $match: { _id: new ObjectId(student_id) }
    //   }, {
    //     $lookup: {
    //       from: "quizzes",
    //       localField: "cur_quiz_id",
    //       foreignField: "_id",
    //       as: "quiz"
    //     }
    //   }, {
    //     $project: {
    //       _id: 0,
    //       quiz: 1
    //     }
    //   }, {
    //     $unwind: "$quiz"
    //   },])
    //   .toArray();

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
      // await database
      //   .collection<Document>("students")
      //   .updateOne({ _id: new ObjectId(student_id) }, {
      //     $set: { cur_quiz_id: "" },
      //     $push: { quiz_done: new ObjectId(student.cur_quiz_id+"") },
      //     $pull: { quiz_joined: new ObjectId(student.cur_quiz_id+"") }
      //   }, { session });

      // await database
      //   .collection<Document>("student_questions")
      //   .updateMany({
      //     student_id: new ObjectId(student_id),
      //     quiz_id: new ObjectId(student.cur_quiz_id+"")
      //   },
      //   {
      //     $set: { submit_date: cur_quiz!.ended_at.toDate() }
      //   }, { session }
      // );

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

    // MongoDB Code
    // Transactions
    // let successUpdatingAnswer = false;
    // const session = client.startSession();
    // try {
    //   session.startTransaction();
    //   const update_data = await database
    //     .collection("student_questions")
    //     .updateOne({
    //       quiz_id: new ObjectId(quiz_id),
    //       student_id: new ObjectId(student_id),
    //       "questions.question_id": new ObjectId(question_id)
    //     }, {
    //       $set: {
    //         "questions.$.answer": new_answer,
    //         "questions.$.answered": (new_answer == "" || new_answer.length <= 0) ? 0 : 1
    //       }
    //     }, { session });

    //   await session.commitTransaction();
    //   if(update_data.matchedCount >= 1) {
    //     successUpdatingAnswer = true;
    //   }
    // }
    // catch(err) {
    //   await session.abortTransaction();
    // }
    // finally {
    //   session.endSession();
    // }

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

    // MongoDB Code
    // const [current_question] = await database
    //   .collection("students")
    //   .aggregate([
    //     {
    //       $lookup: {
    //         from: "student_questions",
    //         let: { curQuizId: "$cur_quiz_id" },
    //         pipeline: [
    //           {
    //             $match: {
    //               $expr: {
    //                 $and: [
    //                   { $eq: ["$quiz_id", "$$curQuizId"] },
    //                   { $eq: ["$student_id", new ObjectId(student_id)] }
    //                 ]
    //               }
    //             }
    //           },
    //         ],
    //         as: "quiz"
    //       }
    //     },
    //     { $unwind: "$quiz" }, // Unwind the quiz array to make it a single object
    //     { $replaceRoot: { newRoot: "$quiz" } }, // Replace the root with the quiz object
    //   ])
    //   .toArray();

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
    
    // MongoDB Code
    // const update_data = await database
    //   .collection("student_questions")
    //   .updateOne({
    //     _id: current_question._id,
    //     "questions.question_id": new ObjectId(question_id)
    //   }, {
    //     $set: {
    //       "questions.$.answered": (status === 0 || status === 1) ? 2 : (answer.length > 0) ? 1 : 0
    //     }
    //   });

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