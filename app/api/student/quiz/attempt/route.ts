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