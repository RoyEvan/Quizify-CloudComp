import { fileNameToGcpLink } from "@/lib/helper/formatting/image";
import { quizCol } from "@/types/collections/quizCol";
import { studentCol } from "@/types/collections/studentCol";
import { studentQuestionCol } from "@/types/collections/studentQuestionCol";
import Questions from "@/types/question";
import { FieldValue } from "firebase-admin/firestore";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// Endpoint untuk ambil soal quiz
export async function GET(req: NextRequest) {
  try {    
    // Ambil student_id dari token
    const token = await getToken({req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET});
    const student_id: string = token!.user_id!.toString();

    // MongoDB Code
    // expected value from params 
    // const quiz_id: string = await database
    //   .collection("students")
    //   .findOne({ _id: new ObjectId(student_id) }, { projection: { cur_quiz_id: 1 } })
    //   .then((student) => {
    //     return student?.cur_quiz_id?.toString();
    //   });

    const studentSnap = await studentCol.doc(student_id).get();
    const studentData: any = { _id: studentSnap.id, ...studentSnap.data() };
    const quiz_id: string = studentData.cur_quiz_id;

    // Mengecek apakah student_id dan quiz_id sudah diinputkan
    if(!quiz_id || !student_id) {
      return NextResponse.json("Quiz ID and Student ID must be a valid value!", { status: 400 });
    }

    // Ambil quiz dari database
    // const quiz = await database
    //   .collection("quizzes")
    //   .findOne({ _id: new ObjectId(quiz_id), deleted_at: { $exists: true, $eq: null } });

    const quizSnap = await quizCol.doc(quiz_id).get();
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
    if(quizData.deleted_at) {
      return NextResponse.json("Quiz Not Found", { status: 404 });
    }

    // Mengecek apakah quiz sudah dibuka atau belum
    const currentTime = new Date();

    // MongoDB Code
    // Jika sudah pernah mengerjakan maka cek apakah student sudah submit
    // const [student] = await database
    // .collection("students")
    // .find({ _id: new ObjectId(student_id) })
    // .toArray();
    
    const quizDone = studentData.quiz_done;
    const hasSubmitted = quizDone.find((qid: string) => {
      return qid == quizData._id;
    });
    // Jika sudah submit maka tidak bisa mengerjakan lagi
    if(hasSubmitted) {
      return NextResponse.json("You cannot attempt this quiz!", { status: 403 });
    }

    // Jika student masih mengerjakan quiz, cek waktu quiz yang sedang dikerjakan
    // Jika waktu quiz yang sedang dikerjakan sudah berakhir, maka submit paksa quiz sekarang dan student bisa mengerjakan quiz yang baru
    if(studentData.cur_quiz_id) {
      // const cur_quiz = await database
      //   .collection("quizzes")
      //   .findOne({ _id: new ObjectId(student.cur_quiz_id+""), deleted_at: { $exists: true, $eq: null } });
      const curQuizSnap = await quizCol.doc(studentData.cur_quiz_id).get();
      const curQuizData: any = {
        _id: curQuizSnap.id,
        ...curQuizSnap.data(),
        created_at: curQuizSnap.data()!.created_at.toDate(),
        opened_at: curQuizSnap.data()!.opened_at.toDate(),
        ended_at: curQuizSnap.data()!.ended_at.toDate(),
        deleted_at: curQuizSnap.data()!.deleted_at?.toDate() || null,
      };
        
      if(curQuizData && curQuizData.ended_at< currentTime && curQuizData._id == quiz_id) {
        // const session = client.startSession();
        // try {
        //   session.startTransaction();
        //   await database
        //     .collection<Document>("students")
        //     .updateOne({ _id: new ObjectId(student_id) }, {
        //       $set: { cur_quiz_id: "" },
        //       $push: { quiz_done: new ObjectId(student.cur_quiz_id+"") },
        //       $pull: { quiz_joined: new ObjectId(student.cur_quiz_id+"") }
        //     }, { session });
        // 
        //   await database
        //     .collection<Document>("student_questions")
        //     .updateMany({ student_id: new ObjectId(student_id), quiz_id: new ObjectId(student.cur_quiz_id+"") }, {
        //       $set: { submit_date: cur_quiz!.ended_at.toDate() }
        //     }, { session });
        // 
        //   await session.commitTransaction();
        // }
        // catch(err) {
        //   console.log(err);
        // 
        //   await session.abortTransaction();
        // }
        // finally {
        //   session.endSession();
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

        await studentQuestionSnap.docs[0].ref.update({
          submit_date: curQuizData.ended_at
        });
      }
    }
    
    if(currentTime < quizData.opened_at || quizData.ended_at < currentTime) { 
      return NextResponse.json("Quiz is not available!", { status: 403 });
    }
    
    // Mengecek apakah student sedang/belum mengerjakan quiz
    const student_attempt = quizData.student_attempt;
    const hasAttempted = student_attempt.find((sid: string) => {
      return sid == student_id;
    });

    // Jika belum pernah mengerjakan maka buat soalnya, dan insert ke DB    
    if(!hasAttempted) {
      return NextResponse.json("You haven't joined this quiz", { status: 403 });
    }
    
    // Hitung durasi sisa waktu sampai quiz berakhir
    const remainingTimeToClose = Math.floor((quizData.ended_at.getTime() - currentTime.getTime()) / 1000);
    const h = Math.floor(remainingTimeToClose/60/60).toString().padStart(2, "0");
    const m = Math.floor(remainingTimeToClose/60%60).toString().padStart(2, "0");
    const s = (remainingTimeToClose%60).toString().padStart(2, "0");
    const remainingTime = `${h}:${m}:${s}`;
    
    // MongoDB Code
    // Ambil semua soal
    // const [student_questions] = await database
    // .collection("student_questions")
    // .aggregate([
    //   {$match: {
    //     quiz_id: quizData._id,
    //     student_id: new ObjectId(student_id)
    //   }},
    //   {$lookup: { 
    //     from: "quizzes",
    //     localField: "quiz_id",
    //     foreignField: "_id",
    //     as: "quiz"
    //   }},
    //   {$unwind: "$quiz"},
    //   {$addFields: {
    //     question_join: "$quiz.questions",
    //     title: "$quiz.title",
    //   }},
    //   {$project: {
    //     _id: 1,
    //     title: 1,
    //     quiz_id: 1,
    //     questions: 1,
    //     question_join: 1,
    //   }}
    // ])
    // .toArray();

    const studentQuestionSnap = await studentQuestionCol
      .where('student_id', '==', student_id)
      .where('quiz_id', '==', quizData._id)
      .get();    

    const studentQuizQuestionSnaps = await studentQuestionSnap.docs[0].ref
      .collection('questions')
      .get();
    const studentQuizQuestionData = studentQuizQuestionSnaps.docs.map((doc) => {      
      return { _id: doc.id, ...doc.data() };
    });

    const questionSnaps = await quizCol
      .doc(quizData._id)
      .collection('questions')
      .get();
    const questionData = questionSnaps.docs.map((doc) => {
      return { question_id: doc.id, ...doc.data() };
    });
    
    const question_join = studentQuizQuestionData;
    const sq_id = studentQuestionSnap.docs[0].id;    

    // Join array a dan b berdasarkan a.question_id == b.id
    const studentQuestionData: any = { _id: sq_id, ...studentQuestionSnap.docs[0].data()};
    studentQuestionData.questions = questionData.map((item: any) => {
      const found = question_join.find((element: any) => {
        return item.question_id == element.question_id;
      });
      
      return {
        ...item,
        ...found,
        question_id: undefined,
        answer_key: undefined,
        corrected: undefined,
        correct_answer: undefined
      };
    });

    // console.log(studentQuestionData.questions);
    

    const sq = {
      _id: sq_id,
      title: studentQuestionData.title,
      quiz_id: studentQuestionData.quiz_id,
      questions: studentQuestionData.questions,
    }

    // Mengubah jawaban yang berupa nama gambar menjadi URL
    sq.questions = await Promise.all(sq.questions.map(async (q: Questions) => {
      if(q.type == "pg" && q.answers) {
        q.answers = await Promise.all(q.answers!.map(async (Key:any) => {
          if(Key.toString().split("_").length === 4) {
            return await fileNameToGcpLink(Key);
          }
          return Key;
        }));
      }

      if(q.img) {
        q.img = (await fileNameToGcpLink(q.img)).toString();
      }

      return q;
    }));
    
    // Jika soal sudah ada, maka kembalikan soal dan waktu sisa ke client
    if(!studentQuestionData) {
      return NextResponse.json("Quiz Not Found", { status: 404 });
    }
    
    return NextResponse.json({ ...sq, remainingTime }, { status: 200 });
  }
  catch(err) {
    console.log(err);
  }

  return NextResponse.json("Failed!", { status: 500})
}