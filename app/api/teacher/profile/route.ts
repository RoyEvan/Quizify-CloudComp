import { client, database } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// to get teacher data
export async function GET(req: NextRequest){
    try {
        const token = await getToken({req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET});
        const teacher_id: string = token!.user_id!.toString();
        if (!teacher_id) {
            return NextResponse.json("Unauthorized access!", { status: 401 });
        }
        const data = await database.collection("teachers").findOne({ _id: new ObjectId(teacher_id) });

        if (!data) {
            return NextResponse.json("Teacher not found!", { status: 404 });
        }
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        return NextResponse.json(error, { status: 500 });
        
    }
}

export async function POST(req: NextRequest){
    const session = client.startSession();
    try {
        const token = await getToken({req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET});
        const teacher_id: string = token!.user_id!.toString();
        if (!teacher_id) {
            return NextResponse.json("Unauthorized access!", { status: 401 });
        }
        const nickname = req.headers.get("nickname");
        const fullname = req.headers.get("fullname");
        const data = await database.collection("teachers").updateOne(
            { _id: new ObjectId(teacher_id) },
            { $set: { nickname, fullname } }
        );
        if (data.modifiedCount > 0) {
            return NextResponse.json("Profile updated!", { status: 200 });
        }
        else {
            return NextResponse.json("Profile not updated!", { status: 400 });
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json("Failed", { status: 500 });
    }
    finally{
        session.endSession();
    }
}

