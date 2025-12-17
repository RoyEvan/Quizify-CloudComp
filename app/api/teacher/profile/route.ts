import { teacherCol } from "@/types/collections/teacherCol";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// to get teacher data
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET });
    const teacher_id: string = token!.user_id!.toString();
    if (!teacher_id) {
      return NextResponse.json("Unauthorized access!", { status: 401 });
    }
    
    const teacherSnap = await teacherCol.doc(teacher_id).get();
    const teacherData = { _id: teacherSnap.id, ...teacherSnap.data() };

    if (!teacherData) {
      return NextResponse.json("Teacher not found!", { status: 404 });
    }
    return NextResponse.json(teacherData, { status: 200 });
  } catch (error) {
    return NextResponse.json(error, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.QUIZIFY_NEXTAUTH_SECRET,
    });
    const teacher_id: string = token!.user_id!.toString();
    if (!teacher_id) {
      return NextResponse.json("Unauthorized access!", { status: 401 });
    }
    const nickname = req.headers.get("nickname");
    const fullname = req.headers.get("fullname");

    const updatedTeacher = await teacherCol.doc(teacher_id).update({ nickname, fullname });
    if (!updatedTeacher) {
      return NextResponse.json("Failed to update profile", { status: 400 });
    }

    return NextResponse.json("Successfully updated profile", { status: 200 });
  }
  catch(err) {
    console.log(err);
  }

  return NextResponse.json("Failed", { status: 500 });
}
