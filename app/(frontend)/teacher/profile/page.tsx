"use client";

import QuizifyNavbar from "@/components/QuizifyNavbar";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button, Input } from "@heroui/react";
import { profileSchema } from "@/lib/validation/validation"; 
import Image from "next/image";


const TeacherProfile = () => {
  const { data: session } = useSession();
  const [profile, setProfile] = useState(null);
  const [nickname, setNickname] = useState("");
  const [fullname, setFullname] = useState("");

  useEffect(() => {
    if (session?.user?.type === "teacher") {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/teacher/profile");
      const data = await res.json();
      if (data) {
        setProfile(data);
        setNickname(data.nickname);
        setFullname(data.fullname);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleProfileUpdate = async () => {
    const { error } = profileSchema.validate({ fullname, nickname }, { abortEarly: false });

    if (error) {
      const newErrors: { fullname?: string; nickname?: string } = {};
      error.details.forEach((detail) => {
        newErrors[detail.path[0] as keyof typeof newErrors] = detail.message;
      });
      setErrors(newErrors);
      return;
    }

    try {
      const res = await fetch("/api/teacher/profile", {
        method: "POST",
        headers: {
          nickname: nickname,
          name: fullname,
        },
      });
      const data = await res.json();
      if (data.status === 200) {
        alert("Profile updated successfully!");
      } else if(data.status === 400) {
        alert("Failed to update profile.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  return (
    <div className="teacher-profile flex h-screen max-h-svh flex-col">
        <QuizifyNavbar />
        
      <div className="max-w-full mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-4">Teacher Profile</h1>
        
        {profile ? (
          <div className="flex space-x-8">
            <div className="flex-none">
              {/* <img */}
              <Image
                src="https://i.pravatar.cc/150?u=a042581f4e29026704d" 
                alt="Profile Picture"
                className="w-32 h-32 rounded border-4 border-white-200" 
              />
            </div>
            <div className="flex-1 min-w-[300px] space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <Input
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  placeholder="Enter your full name"
                  status={errors.fullname ? "error" : "default"}
                />
                {errors.fullname && (
                  <p className="text-sm text-red-500">{errors.fullname}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nickname
                </label>
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter your nickname"
                  status={errors.nickname ? "error" : "default"}
                />
                {errors.nickname && (
                  <p className="text-sm text-red-500">{errors.nickname}</p>
                )}
              </div>
              <div>
                <Button onClick={handleProfileUpdate}>Update Profile</Button>
              </div>
            </div>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
};

export default TeacherProfile;
