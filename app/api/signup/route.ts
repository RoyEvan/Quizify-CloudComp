import { client, database } from "@/lib/mongodb";
import { studentCol } from "@/types/collections/studentCol";
import { teacherCol } from "@/types/collections/teacherCol";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

async function signup(type: string, email: string, name: string) {
  const session = client.startSession();
  let id: ObjectId | null = null;
  try {
    session.startTransaction();

    if(type === "student") {
      id = (await database
        .collection("students")
        .insertOne({
          cur_quiz_id: "",
          email,
          nickname: name.split(" ")[0],
          fullname: name,
          quiz_joined: [],
          quiz_done: [],
        }, { session })).insertedId;
    }
    else if(type === "teacher") {
      id = (await database
        .collection("teachers")
        .insertOne({
          email,
          nickname: name.split(" ")[0],
          fullname: name,
          quiz_created: [],
        }, { session })).insertedId;
    }
    else {
      throw new Error("Invalid Type of User");
    }

    session.commitTransaction();
  }
  catch(err) {
    console.log(err);
    
    session.abortTransaction();

    return null;
  }
  finally {
    session.endSession();

    return id;
  }
}

export async function POST(req: NextRequest) {
  const request = await req.json();
  try {
    
    const email = request.email;
    const name = request.name;
    const type = request.type;
    
    if(!email || !name || (type !== "student" && type !== "teacher")) {
      return NextResponse.json("Request tidak valid!", { status: 400 });
    }

    if(type == "student") {
      // MongoDB Code
      // const student = await database
      //   .collection("students")
      //   .findOne({ email });
      // 
      // const emailUsed = await database
      //   .collection("teachers")
      //   .findOne({ email });

      const studentSnap = await studentCol.where('email', '==', email).get();
      const student = studentSnap.docs.length > 0 ? { id: studentSnap.docs[0].id, ...studentSnap.docs[0].data() } : null;

      const teacherSnap = await teacherCol.where('email', '==', email).get();
      const emailUsed = teacherSnap.docs.length > 0 ? { id: teacherSnap.docs[0].id, ...teacherSnap.docs[0].data() } : null;

      if(emailUsed) {
        return NextResponse.json("Email telah digunakan!", { status: 403 });
      }

      if(student && !emailUsed) {
        return NextResponse.json("OK", { status: 200 });
      }

      const id = await signup(type, email, name);
      if(!id) {
        return NextResponse.json("Gagal membuat akun!", { status: 500 });
      }
    }
    else {
      // MongoDB Code
      // const teacher = await database
      //   .collection("teachers")
      //   .findOne({ email });
      // 
      // const emailUsed = await database
      //   .collection("students")
      //   .findOne({ email });

      const teacherSnap = await teacherCol.where('email', '==', email).get();
      const teacher = teacherSnap.docs.length > 0 ? { id: teacherSnap.docs[0].id, ...teacherSnap.docs[0].data() } : null;

      const studentSnap = await studentCol.where('email', '==', email).get();
      const emailUsed = studentSnap.docs.length > 0 ? { id: studentSnap.docs[0].id, ...studentSnap.docs[0].data() } : null;
      if(emailUsed) {
        return NextResponse.json("Email telah digunakan!", { status: 403 });
      }

      if(teacher && !emailUsed) {
        return NextResponse.json("OK", { status: 200 });
      }
      
      const id = await signup(type, email, name);
      if(!id) {
        return NextResponse.json("Gagal membuat akun!", { status: 500 });
      }
    }

    return NextResponse.json("Berhasil membuat akun!", { status: 200 });
  }
  catch(err) {
    console.log(err);
  }

  return NextResponse.json("Gagal membuat akun!", { status: 500 });
}