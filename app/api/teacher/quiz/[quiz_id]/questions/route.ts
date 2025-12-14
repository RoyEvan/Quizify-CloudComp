import { fileNameToGcpLink } from "@/lib/helper/formatting/image";
import { bucketName, gcloudStorage } from "@/lib/storage/gcp/storage";
import { quizCol } from "@/types/collections/quizCol";
import { fileTypeFromBuffer } from "file-type";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// Upload a Question
export async function POST(req: NextRequest, {params}: {params: {quiz_id: string}}) {     
  try {
    const token = await getToken({ req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET });
    const teacher_id: string|undefined = token?.user_id?.toString();

    const formData = await req.formData();
    
    // These are the expecteed value
    const quiz_id: string = params.quiz_id;
    const title = formData.get("title");
    const type = formData.get("type");
    const answer_key = formData.get("answer_key");
    const img: File = formData.get("img") as File;
    let answers: string[] | undefined = undefined;

    // Generate new question_id
    const questionDoc = quizCol.doc();
    const question_id = questionDoc.id;

    // Jika title, type, atau answer_key tidak ada, maka kembalikan response 400
    if(!quiz_id || !title || !type) {
      return NextResponse.json("Quiz ID, Title dan Type tidak boleh kosong!", { status: 400 });
    }

    // const quiz = await database
    //   .collection("quizzes")
    //   .findOne({ _id: new ObjectId(quiz_id), deleted_at: { $exists: true, $eq: null } });

    const quizSnap = await quizCol.doc(quiz_id).get();
    const quizData: any = quizSnap.exists ? { _id: quizSnap.id, ...quizSnap.data() } : null;
    if(!quizData) {
      return NextResponse.json("Quiz tidak ditemukan!", { status: 404 });
    }
    else if(quizData.teacher_id != teacher_id) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }
    else if(quizData.student_attempt.length > 0) {
      return NextResponse.json("Telah ada siswa yang mengerjakan Quiz!", { status: 400 });
    }
    const quizQuestionCol = quizSnap.ref.collection('questions').doc(question_id);

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
      
      await quizQuestionCol.set({
        title,
        type: type.split("-")[2],
        img: img? imagesInQuestion[0].fileName : "",
        answer_key,
        answers,
      });   
    }
    else {
      await quizQuestionCol.set({
        title,
        type: type.toString().split("-")[2],
        img: img? imagesInQuestion[0].fileName : "",
      });
    }

    // Insert Image in Question ke GCP Storage
    if(imagesInQuestion.length > 0) {
      imagesInQuestion = await Promise.all(
        imagesInQuestion.map(async (img) => {
          const insert_a_img = {
            Bucket: process.env.QUIZIFY_AWS_BUCKET_NAME,
            Key: img.fileName,
            Body: img.fileBuffer
          }
          
          try {
            await gcloudStorage
              .bucket(bucketName)
              .file(img.fileName)
              .save(img.fileBuffer, {
                resumable: false,
                contentType: (await fileTypeFromBuffer(img.fileBuffer))?.mime || 'application/octet-stream',
              }
            );
          }
          catch(err) {
            console.log(err);
          }

          return await fileNameToGcpLink(img.fileName);
        })
      )
    }
    
    answers = answers ? await Promise.all(answers?.map(async (ans: string) => { 
      if(ans.endsWith(".jpg") || ans.endsWith(".png")) {
        return await fileNameToGcpLink(ans);
      }
      return ans;
    })) : [];

    return NextResponse.json({
      msg: "Berhasil menambahkan pertanyaan!",
      data: {
        answer_key,
        answers,
        id: question_id,
        title,
        img: img? imagesInQuestion.shift() : "",
        type: type.toString().split("-")[2],
      }
    }, { status: 200 });
  }
  catch(err) {
    console.log(err);
  }

  return NextResponse.json("Gagal!", { status: 500})
}

// Delete a Question
export async function DELETE(req: NextRequest, {params}: {params: {quiz_id: string}}) {
  try {
    const token = await getToken({req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET});
    const request = await req.json();

    const teacher_id: string|undefined = token?.user_id?.toString();
    const question_id: string = request.question_id.toString();
    const quiz_id: string = params.quiz_id.toString();

    if(!quiz_id.trim() || !question_id.trim()) {
      return NextResponse.json("Quiz ID and Question ID must be a valid value!", { status: 400 });
    }

    // Get the quiz
    // const quiz = await database
    //   .collection("quizzes")
    //   .findOne({
    //     _id: new ObjectId(quiz_id.trim()),
    //     teacher_id: new ObjectId(teacher_id),
    //     deleted_at: { $exists: true, $eq: null }
    //   });
    
    const quizSnap = await quizCol.doc(quiz_id.trim()).get();
    const quizData: any = quizSnap.exists ? {
      _id: quizSnap.id,
      ...quizSnap.data(),
    } : null;

    // Check if she is the owner of the quiz
    if(quizData.teacher_id != teacher_id) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const quizQuestionSnaps = await quizSnap.ref.collection('questions').get();
    const quizQuestionData = quizQuestionSnaps.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    quizData.questions = quizQuestionData;

    if(!quizData) {
      return NextResponse.json("Quiz not found!", { status: 404 });
    }
    else if(quizData.student_attempt.length > 0) {
      return NextResponse.json("Quiz has been attempted by students!", { status: 400 });
    }

    // Get the question
    const question = quizData.questions.find((q: any) => q.id === question_id.trim());
    if(!question) {
      return NextResponse.json("Question not found!", { status: 404 });
    }

    await quizSnap.ref.collection('questions').doc(question_id.trim()).delete();

    // Delete the images from GCP Cloud Storage
    await gcloudStorage.bucket(bucketName).deleteFiles({
      prefix: quiz_id.trim() + "_" + question_id.trim()
    });

    return NextResponse.json({
      msg: "Successfully deleted a question!",
      data: { question_id }
    }, { status: 200 });
  }
  catch(err) {
    console.log(err);
  }

  return NextResponse.json("Failed!", { status: 500 });
}