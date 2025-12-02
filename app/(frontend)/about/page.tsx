"use client";

import TeamMember from "@/components/about/TeamMember";
import QuizifyNavbar from "@/components/QuizifyNavbar";

export default function Page() {
  const teamMembers = [
    {
      name: "Albert Valentino Utomo",
      position: "222310662",
      description: "Frontend Developer",
      image: "/team_member/Albert.jpeg", // Ganti dengan jalur gambar yang sesuai
    },
    {
      name: "Bima Aqsa Prasetya",
      position: "222310663",
      description: "Frontend Developer",
      image: "/team_member/Bima.jpeg", // Ganti dengan jalur gambar yang sesuai
    },
    {
      name: "Kevin Jonathan Halim",
      position: "222310664",
      description: "Frontend Developer",
      image: "/team_member/Kevin.jpg", // Ganti dengan jalur gambar yang sesuai
    },

    {
      name: "RAYMOND LYANTO HOENTORO",
      position: "222310667",
      description: "Backend Developer",
      image: "/team_member/Raymond.jpeg", // Ganti dengan jalur gambar yang sesuai
    },
    {
      name: "Roy Evan Wiguna",
      position: "222310670",
      description: "Backend Developer",
      image: "/team_member/Roy.jpeg", // Ganti dengan jalur gambar yang sesuai
    },
  ];

  return (
    <>
      <QuizifyNavbar />
      <div className="team-page">
        <h1>Meet Our Team</h1>
        <div className="team-page__members">
          {teamMembers.map((member, index) => (
            <TeamMember
              key={index}
              image={member.image}
              name={member.name}
              position={member.position}
              description={member.description}
            />
          ))}
        </div>
      </div>
    </>
  );
}
