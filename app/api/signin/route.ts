import { studentCol } from "@/types/collections/studentCol";
import { teacherCol } from "@/types/collections/teacherCol";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const request = await req.json();
  try {
    const email = request.email;
    const type = request.type;

    if(!email || (type !== "student" && type !== "teacher")) {
      return NextResponse.json("Request tidak valid!", { status: 400 });
    }

    if(type == "student") {
      // MongoDB Code
      // const student = await database
      //   .collection("students")
      //   .findOne({ email });

      // convert this code into using firebase firestore
      
      const studentSnap = await studentCol.where('email', '==', email).get();
      const student = !studentSnap.empty ? { id: studentSnap.docs[0].id, ...studentSnap.docs[0].data() } : null;
      if(student) {
        return NextResponse.json(student.id, { status: 200 });
      }  
    }
    else {
      // MongoDB Code
      // const teacher = await database
      //   .collection("teachers")
      //   .findOne({ email });

      // convert this code into using firebase firestore
      const teacherSnap = await teacherCol.where('email', '==', email).get();
      const teacherData = !teacherSnap.empty ? { id: teacherSnap.docs[0].id, ...teacherSnap.docs[0].data() } : null;

      if(teacherData) {
        return NextResponse.json(teacherData.id, { status: 200 });
      }
    }
  }
  catch(err) {
    console.log(err);
  }

  return NextResponse.json("Gagal Sign In!", { status: 500 });
}