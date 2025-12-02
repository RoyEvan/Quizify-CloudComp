import { client, database } from "@/lib/mongodb";
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
  const res = await database
    .collection("quizzes")
    .find({ access_code, deleted_at: { $exists: true, $eq: null } })
    .toArray();

  return res.length > 0;
}

// Retrieve Quizzes
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET});
    const teacher_id: string | undefined = token?.user_id?.toString();
    // const teacher_id: string | undefined = "67222a3ba3afc3a8672a198b";
    // const teacher_id: string | undefined = "67232fccfd6e9633cc4e297b";
    
    const res = await database
      .collection("quizzes")
      .find({ teacher_id: new ObjectId(teacher_id), deleted_at: { $exists: true, $eq: null } })
      .sort("created_at", -1)
      .toArray();
    
    const returnData = res.map((quiz: any) => {
      return {
        _id: quiz._id.toString(),
        title: quiz.title,
        quiz_started: quiz.opened_at,
        quiz_ended: quiz.ended_at,
        access_code: quiz.access_code,
        student_attempt: quiz.student_attempt.length,
        student_joined: quiz.student_joined.length,
        questions: quiz.questions.length,
      }
    });
    
    return NextResponse.json(returnData, { status: 200 });
    // if(returnData.length > 0) {
    // }
    // else {
    //   return NextResponse.json("Quiz Not Found", { status: 404 });
    // }
  }
  catch(err) {
    console.log(err);
    
    return NextResponse.json("Failed!", { status: 500})
  }
}

// Add New Quiz
export async function POST(req: NextRequest) {
  const request = await req.json();
  try {

    const title: string = request.title?.toString().trim();
    const opened_at: Date = new Date(request.opened_at?.toString().trim());
    const ended_at: Date = new Date(request.ended_at?.toString().trim());
    let access_code: string = request.access_code?.toString().trim();

    const token = await getToken({req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET});
    const teacher_id: string | undefined = token?.user_id?.toString();
    // const teacher_id: string = "67222a3ba3afc3a8672a198b";
    

    if(!title || !opened_at || !ended_at || !teacher_id) {
      // Memastikan semua inputan sudah diisi
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
    
    const insert = await database
      .collection("quizzes")
      .insertOne({
        title,
        created_at: new Date(),
        opened_at,
        ended_at,
        access_code,
        teacher_id: new ObjectId(teacher_id),
        student_attempt: [],
        student_joined: [],
        questions: [],
        deleted_at: null,
      });
    const quiz_id = insert.insertedId;
      
    return NextResponse.json({
      msg: "Quiz successfully added!",
      data: {
        _id: quiz_id.toString(),
        title,
        quiz_started: opened_at,
        quiz_ended: ended_at,
        access_code,
        student_attempt: 0,
        student_joined: 0,
        questions: 0,
      }
    }, { status: 200 });
  }
  catch(err) {

    console.log(err);
    
    return NextResponse.json("Failed", { status: 500 });
  }
}

// Delete Quiz
export async function DELETE(req: NextRequest) {
  const request = await req.json();
  try {
    const quiz_id: string = request.quiz_id.toString();
    
    const token = await getToken({req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET});
    const teacher_id: string | undefined = token?.user_id?.toString();
    // const teacher_id: string|undefined = "67222a3ba3afc3a8672a198b";
    // const teacher_id: string|undefined = "67232fccfd6e9633cc4e297b";

    if(!ObjectId.isValid(quiz_id)) {
      return NextResponse.json("Invalid Quiz ID", { status: 400 });
    }

    // Get the Quiz
    const quiz = await database
      .collection("quizzes")
      .findOne({
        _id: new ObjectId(quiz_id),
        teacher_id: new ObjectId(teacher_id),
        deleted_at: { $exists: true, $eq: null }
      });
    if(!quiz) {
      return NextResponse.json("Quiz Not Found", { status: 404 });
    }


    // const questions = quiz.questions;
    // const imagesInQuestions: { Key: string }[] = [];
    // if(quiz.questions.length > 0) {
    //   quiz.questions.map((q: any) => {
    //     if(q.img) {
    //       imagesInQuestions.push({ Key: q.img });
    //     }
        
    //     q.answers?.map((Key: string) => {
    //       if(Key.endsWith(".jpg") || Key.endsWith(".png")) {
    //         imagesInQuestions.push({ Key });
    //       }
    //       return Key;
    //     });
    //   });
    // }
    
    const session = client.startSession();
    let successDeletingQuestion = false;
    try {
      session.startTransaction();

      await database
        .collection("student_questions")
        .deleteMany({
          quiz_id: new ObjectId(quiz_id),
        }, { session });

      await database
        .collection("quizzes")
        .updateOne({
          _id: new ObjectId(quiz_id),
          teacher_id: new ObjectId(teacher_id),
        }, {
          $set: {
            deleted_at: new Date(),
          }
        }, { session });

      // if(imagesInQuestions.length > 0) {
      //   // Delete the images from S3
      //   await s3Client.send(new DeleteObjectsCommand({
      //     Bucket: process.env.QUIZIFY_AWS_BUCKET_NAME,
      //     Delete: {
      //       Objects: imagesInQuestions,
      //     }
      //   }));
      // }

      await session.commitTransaction();
      successDeletingQuestion = true;
    }
    catch(err) {
      await session.abortTransaction();
    }
    finally {
      await session.endSession();
    }


    if(!successDeletingQuestion) {
      throw new Error("Failed to delete quiz");
    }
    
    return NextResponse.json({
      msg: "Quiz successfully deleted!",
      data: {
        quiz_id,
      }
    }, { status: 200 });
  }
  catch(err) {

    console.log(err);
    
    return NextResponse.json("Failed", { status: 500 });
  }
}
