import { quizCol } from "@/types/collections/quizCol";
import { studentCol } from "@/types/collections/studentCol";
import { studentQuestionCol } from "@/types/collections/studentQuestionCol";
import { FieldValue } from "firebase-admin/firestore";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

function randomiseQuestions(questions: any) {
  const usedNum: number[] = [];
  const randomised = questions.map((item: any, index: number) => {
    // Random nomor urutan soal
    // dan jika nomor urutan soal sudah ada, maka random lagi
    let rand_seq: number = Math.floor(Math.random() * questions.length);
    while(usedNum.includes(rand_seq)) {
      rand_seq = Math.floor(Math.random() * questions.length);
    }
    
    // Menyimpan nomor urutan soal yang sudah di random dan tidak duplikat
    usedNum.push(rand_seq);

    // Mengembalikan data soal yang sudah di random dengan format yang diinginkan
    return {
      question_id: questions[rand_seq]._id,
      rand_seq: index+1,
      answered: 0,
      answer: "",
      corrected: 0,
      correct_answer: false, 
      points: 0
    };
  });

  return randomised;
}

// Endpoint untuk attempt quiz 
export async function POST(req: NextRequest) {
  try {
    const request = await req.json();
    const quiz_id: string = request.quiz_id!;

    const token = await getToken({req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET});
    const student_id: string|undefined = token?.user_id?.toString();

    

    // Mengecek apakah student_id dan quiz_id sudah diinputkan
    if(!quiz_id || !student_id) {
      return NextResponse.json("Quiz ID and Student ID must be a valid value!", { status: 400 });
    }
    
    // MongoDB Code
    // // Ambil quiz dari database
    // const quiz = await database
    //   .collection("quizzes")
    //   .findOne({ _id: new ObjectId(quiz_id), deleted_at: { $exists: true, $eq: null } });
    // if(!quiz) {
    //   return NextResponse.json("Quiz Not Found", { status: 404 });
    // }
    // 
    // const student = await database
    //   .collection("students")
    //   .findOne({ _id: new ObjectId(student_id) });
    // if(!student) {
    //   return NextResponse.json("Student Not Found", { status: 404 });
    // }

    const quizSnap = await quizCol.doc(quiz_id).get();
    const quizData: any = {
      _id: quizSnap.id,
      ...quizSnap.data(),
      created_at: quizSnap.data()!.created_at.toDate(),
      opened_at: quizSnap.data()!.opened_at.toDate(),
      ended_at: quizSnap.data()!.ended_at.toDate(),
      deleted_at: quizSnap.data()!.deleted_at?.toDate() || null,
    };

    const questionSnaps = await quizSnap.ref.collection('questions').get();
    
    // Mengecek apakah quiz sudah dibuka atau belum
    const currentTime = new Date();
    if(quizData.deleted_at || currentTime < quizData.opened_at || quizData.ended_at < currentTime || questionSnaps.empty) {
      return NextResponse.json("Quiz is not available!", { status: 403 });
    }

    quizData.questions = questionSnaps.docs.map((doc) => ({
      _id: doc.id,
      ...doc.data(),
    }));

    const studentSnap = await studentCol.doc(student_id).get();
    const studentData: any = { _id: studentSnap.id, ...studentSnap.data() };
      
    // Mengecek apakah student sudah/belum bergabung ke quiz
    const hasJoined = studentData.quiz_joined.find((qid: string) => { return qid == quiz_id; });
    if(!hasJoined) {
      return NextResponse.json("You have not joined this quiz!", { status: 403 });
    }
    
    // Jika student masih mengerjakan quiz, cek waktu quiz yang sedang dikerjakan
    // Jika waktu quiz yang sedang dikerjakan sudah berakhir, maka submit paksa quiz sekarang dan student bisa mengerjakan quiz yang baru
    if(studentData.cur_quiz_id) {
      // // MongoDB Code
      // const cur_quiz = await database
      //   .collection("quizzes")
      //   .findOne({ _id: new ObjectId(student.cur_quiz_id+""), deleted_at: { $exists: true, $eq: null } });
      // 
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

      const curQuizSnap = await quizCol.doc(studentData.cur_quiz_id).get();
      const curQuizData: any = {
        _id: curQuizSnap.id,
        ...curQuizSnap.data(),
        created_at: curQuizSnap.data()!.created_at.toDate(),
        opened_at: curQuizSnap.data()!.opened_at.toDate(),
        ended_at: curQuizSnap.data()!.ended_at.toDate(),
        deleted_at: curQuizSnap.data()!.deleted_at?.toDate() || null,
      };
      if(curQuizData && currentTime < curQuizData.ended_at) {
        return NextResponse.json("You are currently attempting another quiz!", { status: 403 });
      }

      studentSnap.ref.update({
        cur_quiz_id: "",
        quiz_done: FieldValue.arrayUnion(studentData.cur_quiz_id),
        quiz_joined: FieldValue.arrayRemove(studentData.cur_quiz_id)
      });
      
      const studentQuestionSnap = await studentQuestionCol
        .where("student_id", "==", student_id)
        .where("quiz_id", "==", studentData.cur_quiz_id)
        .get();
      
      await studentQuestionSnap.docs[0].ref.update({
        submit_date: curQuizData.ended_at
      });
    }

    // Mengecek apakah student sudah pernah mengerjakan quiz
    const hasAttempted = quizData.student_attempt.find((sid: string) => {
      return sid == student_id;
    });    

    // Jika belum pernah mengerjakan maka random soalnya, dan insert ke DB    
    if(!hasAttempted) {
      // MongoDB Code
      // // Ambil Soal urut berdasarkan sequence
      // const quizzes = await database
      //   .collection("quizzes")
      //   .findOne({ _id: quizData._id, deleted_at: { $exists: true, $eq: null } });
      // const questions: any[]  = quizzes!.questions;

      const questionSnaps = await quizSnap.ref.collection('questions').get();
      const questionData = questionSnaps.docs.map((doc) => ({
        _id: doc.id,
        ...doc.data(),
      }));
      
      const randomisedQuestions = randomiseQuestions(questionData);
      const randomised = {
        quiz_id: quizData._id,
        student_id: student_id,
        score: 0,
        corrected: false,
        submit_date: null
      };

      // MongoDB Code
      // // Insert ke DB
      // const session = client.startSession();
      // try {
      //   // Start transaction
      //   session.startTransaction();

      //   // Insert soal yg sudah di random ke student_questions
      //   // const insertSoal = await database
      //   await database
      //     .collection("student_questions")
      //     .insertOne(randomised, { session });
      // 
      //   // Insert student_id ke student_attempt pada collection quizzes
      //   // const addStudentId = await database
      //   await database
      //     .collection<Document>("quizzes")
      //     .updateOne({
      //       _id: new ObjectId(quiz._id.toString().trim()),
      //       deleted_at: { $exists: true, $eq: null }
      //     }, {
      //       $push: { student_attempt: new ObjectId(student_id) },
      //       $pull: { student_joined: new ObjectId(student_id) }
      //     }, {
      //       session
      //     });
      // 
      //   // Set quiz_id ke cur_quiz_id students
      //   // const insertQuizId = await database
      //   await database
      //     .collection<Document>("students")
      //     .updateOne({ _id: new ObjectId(student_id) }, {
      //       $set: { cur_quiz_id: new ObjectId(quiz._id) }
      //     }, { session });
      // 
      //   // Commit transaction
      //   await session.commitTransaction();
      // }
      // catch(err) {
      //   // Rollback transaction
      //   await session.abortTransaction(); 
      // 
      //   console.log(err);
      // }
      // finally {
      //   // End session
      //   session.endSession();     
      // }

      const insertStudentQuestionDoc = await studentQuestionCol.add(randomised);
      const questionsCollection = insertStudentQuestionDoc.collection('questions');
      await Promise.all(randomisedQuestions.map(async (question: any) => await questionsCollection.add(question)));
      await quizSnap.ref.update({
        student_attempt: FieldValue.arrayUnion(student_id),
        student_joined: FieldValue.arrayRemove(student_id)
      });

      await studentSnap.ref.update({
        cur_quiz_id: quizData._id
      });
      
      return NextResponse.json({
        msg: "Successfully attempted the quiz!",
        data: {
          quiz_id: quizData._id,
          title: quizData.title,
          quiz_started: quizData.opened_at,
          quiz_ended: quizData.ended_at,
        }
      }, { status: 200 });
    }
    else {
      // Jika sudah pernah mengerjakan maka cek apakah student sudah submit
      const hasSubmitted = studentData!.quiz_done.find((qid: string) => qid == quiz_id);
  
      // Jika sudah submit maka tidak bisa mengerjakan lagi
      if(hasSubmitted) {
        return NextResponse.json("You cannot attempt this quiz!", { status: 403 });
      }

      // Jika belum submit maka lanjutkan mengerjakan quiz
      return NextResponse.json("Finish this quiz!", { status: 200 });
    }
  }
  catch(err) {
    console.log(err);
  }

  return NextResponse.json("Failed!", { status: 500})
}