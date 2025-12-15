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

    // MongoDB Code
    // const data = await database
    //   .collection("teachers")
    //   .findOne({ _id: new ObjectId(teacher_id) });
    
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
  // MongoDB Code
  // const session = client.startSession();
  // try {
  //   const token = await getToken({
  //     req,
  //     secret: process.env.QUIZIFY_NEXTAUTH_SECRET,
  //   });
  //   const teacher_id: string = token!.user_id!.toString();
  //   if (!teacher_id) {
  //     return NextResponse.json("Unauthorized access!", { status: 401 });
  //   }
  //   const nickname = req.headers.get("nickname");
  //   const fullname = req.headers.get("fullname");
  //   const data = await database
  //     .collection("teachers")
  //     .updateOne(
  //       { _id: new ObjectId(teacher_id) },
  //       { $set: { nickname, fullname } }
  //     );
  //   if (data.modifiedCount > 0) {
  //     return NextResponse.json("Profile updated!", { status: 200 });
  //   } else {
  //     return NextResponse.json("Profile not updated!", { status: 400 });
  //   }
  // } catch (error) {
  //   console.error(error);
  //   return NextResponse.json("Failed", { status: 500 });
  // } finally {
  //   session.endSession();
  // }

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

    // MongoDB Code
    // const data = await database
    //   .collection("teachers")
    //   .updateOne(
    //     { _id: new ObjectId(teacher_id) },
    //     { $set: { nickname, fullname } }
    //   );
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
