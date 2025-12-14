import { quizCol } from "@/types/collections/quizCol";
import { studentCol } from "@/types/collections/studentCol";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({
      message: "Success Fetching Buckets",
      data: quizCol.doc().id
    }, { status: 200 });
  }
  catch (err) {
    console.log(err);
  }

  return NextResponse.json({ message: "Failed" }, { status: 500 });
}