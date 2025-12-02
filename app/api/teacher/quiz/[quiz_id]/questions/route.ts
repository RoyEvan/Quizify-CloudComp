import { fileNameToAwsLink1 } from "@/lib/helper/formatting/image";
import { client, database } from "@/lib/mongodb";
import { s3Client } from "@/lib/storage/s3client";
import { DeleteObjectsCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { fileTypeFromBuffer } from "file-type";
import { ObjectId } from "mongodb";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// Upload a Question
export async function POST(req: NextRequest, {params}: {params: {quiz_id: string}}) {     
  try {
    const formData = await req.formData();
    
    // These are the expecteed value
    const quiz_id: string = params.quiz_id;
    const title = formData.get("title");
    const type = formData.get("type");
    const answer_key = formData.get("answer_key");
    const img: File = formData.get("img") as File;
    let answers: string[] | undefined = undefined;

    // Generate new question_id
    const question_id = new ObjectId();

    // Jika title, type, atau answer_key tidak ada, maka kembalikan response 400
    if(!ObjectId.isValid(quiz_id) || !title || !type) {
      return NextResponse.json("Quiz ID, Title dan Type tidak boleh kosong!", { status: 400 });
    }

    const quiz = await database
      .collection("quizzes")
      .findOne({ _id: new ObjectId(quiz_id), deleted_at: { $exists: true, $eq: null } });
    if(!quiz) {
      return NextResponse.json("Quiz tidak ditemukan!", { status: 404 });
    }
    else if(quiz.student_attempt.length > 0) {
      return NextResponse.json("Telah ada siswa yang mengerjakan Quiz!", { status: 400 });
    }

    // Pengecekkan apakah file type Question Image benar2 jpg atau png
    // q = question
    let imagesInQuestion = [];
    if(img) {
      const q_img_arrayBuffer = await img.arrayBuffer();
      const q_img_buffer = Buffer.from(q_img_arrayBuffer);
      const q_img_type = await fileTypeFromBuffer(q_img_buffer);
      if(!q_img_type || !q_img_type.ext || !q_img_type.mime || (q_img_type.ext !== "jpg" && q_img_type.ext !== "png")) {    
        return NextResponse.json("File ekstensi gambar harus .jpg atau .png", { status: 400 });
      }
  
      const q_img_fileName = `${quiz_id}_question_${question_id}.${q_img_type?.ext}`;

      imagesInQuestion.push({
        fileBuffer: q_img_buffer,
        fileName: q_img_fileName,
      });      
    }
    
    // Jika Tipe Soal adalah pilihan ganda, maka cek apakah ada gambar untuk setiap jawaban
    // Transaction
    const session = client.startSession();
    let successAddingQuestion = false;
    try {
      session.startTransaction();

      if(type === "question-type-pg") {
        answers = [];

        if(!answer_key || answer_key.toString().trim().length <= 0) {
          return NextResponse.json("Kunci jawaban harus dipilih pada pertanyaan jenis Pilihan Ganda!", { status: 400 });
        }

        let counter = 0;
        while (formData.has(`answers[${counter}].answer`) && formData.has(`answers[${counter}].img`)) {
          const answer = formData.get(`answers[${counter}].answer`);
          const answerIsImg = formData.get(`answers[${counter}].img`) == "true"? true: false;
          
          if(!answer) {          
            return NextResponse.json("Pilihan jawaban tidak ditemukan!", { status: 400 })
          }

          // Pengecekkan apakah file type Answer Image benar2 jpg atau png
          if(answerIsImg) {     
            const answerFile: File = answer as File;

            // a = answer
            const a_img_arrayBuffer = await answerFile.arrayBuffer();
            const a_img_buffer = Buffer.from(a_img_arrayBuffer);
            const a_img_type = await fileTypeFromBuffer(a_img_buffer);

            // Jika file type Answer Image bukan jpg atau png, maka kembalikan response 400
            if(!a_img_type || !a_img_type.ext || !a_img_type.mime || (a_img_type.ext !== "jpg" && a_img_type.ext !== "png")) {           
              return NextResponse.json("File ekstensi gambar harus .jpg atau .png", { status: 400 });
            }

            // Jika file type Answer Image adalah jpg atau png, maka push ke array khusus untuk menyimpan jawaban dengan gambar
            const a_img_fileName = `${quiz_id}_${question_id}_answer_${counter}.${a_img_type.ext}`;
            imagesInQuestion.push({
              fileBuffer: a_img_buffer,
              fileName: a_img_fileName,
            });

            answers.push(a_img_fileName);
          }
          else {
            answers.push(answer.toString());
          }

          // Increment counter
          counter++;
        }
        

        // Jika tidak ada jawaban, maka kembalikan response 400
        if(answers.length < 2 && imagesInQuestion.length <= 0) {
          return NextResponse.json("Pilihan jawaban harus lebih dari 1 pada pertanyaan jenis Pilihan Ganda!", { status: 400 });
        }
        
        
        // Insert Question to MongoDB
        await database
          .collection<Document>("quizzes")
          .updateOne({ _id: new ObjectId(quiz_id), deleted_at: { $exists: true, $eq: null } }, {
            $push: {
              questions: {
                id: question_id,
                // sequence: quiz.questions.length + 1,
                title,
                type: type.split("-")[2],
                img: img? imagesInQuestion[0].fileName : "",
                answer_key,
                answers,

              }
            }
          }, { session });


        await session.commitTransaction();
        successAddingQuestion = true;        
      }
      else {        
        // Insert Question to MongoDB
        await database
          .collection<Document>("quizzes")
          .updateOne({ _id: new ObjectId(quiz_id), deleted_at: { $exists: true, $eq: null } }, {
            $push: {
              questions: {
                id: question_id,
                // sequence: quiz.questions.length + 1,
                title,
                type: type.toString().split("-")[2],
                img: img? imagesInQuestion[0].fileName : "",
              }
            }
          }, { session });
        successAddingQuestion = true;
      }

      // Insert Image in Question ke AWS S3
      if(imagesInQuestion.length > 0 && successAddingQuestion) {
        imagesInQuestion = await Promise.all(
          imagesInQuestion.map(async (img) => {
            const insert_a_img = {
              Bucket: process.env.QUIZIFY_AWS_BUCKET_NAME,
              Key: img.fileName,
              Body: img.fileBuffer
            }
            
            try {
              await s3Client.send(new PutObjectCommand(insert_a_img));
            }
            catch(err) {
              console.log(err);
            }

            return await fileNameToAwsLink1(img.fileName);
          })
        )
      }

      if(successAddingQuestion) {
        await session.commitTransaction();
      }
      else {
        throw new Error("Gagal menambahkan pertanyaan!");
      }
    }
    catch(err) {
      await session.abortTransaction();
    }
    finally {
      session.endSession();
    }

    const newQuestion = {
      answer_key,
      answers: undefined,
      id: question_id,
      img: undefined,
      title,
      type: type.toString().split("-")[2],
    }

    
    if(successAddingQuestion) {
      answers = answers ? await Promise.all(answers?.map(async (ans: string) => { 
        if(ans.endsWith(".jpg") || ans.endsWith(".png")) {
          return await fileNameToAwsLink1(ans);
        }
        return ans;
      })) : undefined

      return NextResponse.json({
        msg: "Berhasil menambahkan pertanyaan!",
        data: {
          id: question_id,
          title,
          type: type.toString().split("-")[2],
          answer_key,
          img: img? imagesInQuestion.shift() : "",
          answers,
        }
      }, { status: 200 });
    }
  
    return NextResponse.json("Gagal menambahkan pertanyaan!", { status: 500 });
  }
  catch(err) {
    console.log(err);
    return NextResponse.json("Gagal!", { status: 500})
  }
}

// Update a Question
// export async function PUT(req: NextRequest, {params}: {params: {quiz_id: string}}) {
//   try {
//     return NextResponse.json("Not Implemented", { status: 501 });

//     const formData = await req.formData();
    
//     // These are the expected value
//     const quiz_id = params.quiz_id;
//     const question_id: string = formData.get("question_id")!.toString();
//     const title: string = formData.get("title")!.toString();
//     const type: string = formData.get("type")!.toString();
//     const answer_key: number|undefined|null|string = formData.get("answer_key")!.toString();
//     const img: File = formData.get("img") as File;

//     // quiz_id, question_id, title, type, atau answer_key tidak ada, maka kembalikan response 400
//     if(!quiz_id || !question_id || !title || !type || !answer_key) {
//       return NextResponse.json("Quiz ID, Question ID, Title and Type must be provided!", { status: 400 });
//     }

//     return NextResponse.json("Successfully updated question", { status: 200 });
//   }
//   catch(err) {
//     console.log(err);
//     return NextResponse.json("Failed!", { status: 500 });
//   }
// }

// Delete a Question
export async function DELETE(req: NextRequest, {params}: {params: {quiz_id: string}}) {
  const request = await req.json();
  try {
    const question_id: string = request.question_id.toString();
    const quiz_id: string = params.quiz_id.toString();
    
    const token = await getToken({req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET});
    const teacher_id: string|undefined = token?.user_id?.toString();
    // const teacher_id: string|undefined = "67222a3ba3afc3a8672a198b";
    // const teacher_id: string|undefined = "67232fccfd6e9633cc4e297b";
    // const teacher_id: string|undefined = "6787db18a10aa60345d43208";
    

    if(!quiz_id.trim() || !question_id.trim() || !ObjectId.isValid(quiz_id.trim()) || !ObjectId.isValid(question_id.trim())) {
      return NextResponse.json("Quiz ID and Question ID must be a valid value!", { status: 400 });
    }

    // Get the quiz
    const quiz = await database
      .collection("quizzes")
      .findOne({
        _id: new ObjectId(quiz_id.trim()),
        teacher_id: new ObjectId(teacher_id),
        deleted_at: { $exists: true, $eq: null }
      });
    if(!quiz) {
      return NextResponse.json("Quiz not found!", { status: 404 });
    }
    else if(quiz.student_attempt.length > 0) {
      return NextResponse.json("Quiz has been attempted by students!", { status: 400 });
    }

    // Check if she is the owner of the quiz
    if(quiz.teacher_id.toString() !== teacher_id) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    // Get the question
    const question = quiz.questions.find((q: any) => q.id.toString() === question_id.trim());
    if(!question) {
      return NextResponse.json("Question not found!", { status: 404 });
    }
    
    const imagesInQuestion: { Key: string }[] = [];
    if(question.img !== "") {
      imagesInQuestion.push({ Key: question.img });
    }

    question.answers?.map((Key: string) => {
      if(Key.endsWith(".jpg") || Key.endsWith(".png")) {
        imagesInQuestion.push({ Key });
      }
      return Key;
    })

    // Delete the question
    // Transaction
    const session = client.startSession();
    let successDeletingQuestion = false;
    try {
      session.startTransaction();

      // Delete the question
      await database
        .collection<Document>("quizzes")
        .updateOne({ _id: new ObjectId(quiz_id.trim()), deleted_at: { $exists: true, $eq: null } }, {
          $pull: {
            questions: {
              id: new ObjectId(question_id.trim())
            }
          }
        }, { session });

      if(imagesInQuestion.length > 0) {
        // Delete the images from S3
        await s3Client.send(new DeleteObjectsCommand({
          Bucket: process.env.QUIZIFY_AWS_BUCKET_NAME,
          Delete: {
            Objects: imagesInQuestion,
          }
        }));
      }

      await session.commitTransaction();
      successDeletingQuestion = true;
    }
    catch(err) {
      await session.abortTransaction();
    }
    finally {
      session.endSession();
    }

    if(!successDeletingQuestion) {  
      throw new Error("Failed to delete question");
    }

    return NextResponse.json({
      msg: "Successfully deleted a question!",
      data: {
        question_id
      }
    }, { status: 200 });
  }
  catch(err) {
    console.log(err);
    
    return NextResponse.json("Failed!", { status: 500 });
  }
}