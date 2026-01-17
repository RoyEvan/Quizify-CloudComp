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
      name: "Kevin Jonathan Halim",
      position: "222310664",
      description: "Frontend Developer",
      image: "/team_member/Kevin.jpg", // Ganti dengan jalur gambar yang sesuai
    },
    {
      name: "Raymond Lyanto Hoentoro",
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
        <div className="team-page__header">
          <h1>Meet Our Team</h1>
          <p>Quizify</p>
        </div>
        
        <div className="team-page__members">
          {teamMembers.map((member, index) => (
            <div className="team-member" key={index}>
              <div className="team-member__image-wrapper">
                <img 
                  src={member.image} 
                  alt={member.name} 
                  className="team-member__image"
                />
              </div>
              <div className="team-member__info">
                <h3 className="team-member__name">{member.name}</h3>
                <p className="team-member__position">{member.position}</p>
                <p className="team-member__description">{member.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
