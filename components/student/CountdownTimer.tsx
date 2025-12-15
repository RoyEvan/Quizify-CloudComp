import { useState, useEffect } from "react";
import { Audiowide } from "next/font/google";
import { useRouter } from "next/navigation";
import { Alert } from "@heroui/react";

const AudiowideDecor = Audiowide({
  weight: "400", // Add the required weight property
  subsets: ["latin"],
  display: "swap",
});

const CountdownTimer = ({ timeLeft }) => {
  const router = useRouter();

  const [time, setTime] = useState(() => {
    const [hours, minutes, seconds] = timeLeft.split(":").map(Number);
    return hours * 3600 + minutes * 60 + seconds; // Total seconds
  });

  useEffect(() => {
    
    const timer = setInterval(() => {
      setTime((prev) => (prev > 0 ? prev - 1 : 0));
      if (time <= 0) {
        router.push("/student");
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds]
      .map((unit) => String(unit).padStart(2, "0"))
      .join(":");
  };

  return (
    <>
      <span
        key={time}
        className={`${AudiowideDecor.className} count-down text-4xl font-bold text-center p-4 border-b-1 border-neutral-700`}
        style={{
          color:
            "hsl(347, 77%, " + ((Math.min(600, time) / 600) * 50 + 50) + "%)",
        }}
      >
        {time > 0 ? formatTime(time) : "00:00:00"}
      </span>
      {time < 60 ? (
        <Alert color={"danger"} radius="none" title={"Segera Kumpulkan Quiz Anda!"} />
      ) : (
        ""
      )}
    </>
  );
};

export default CountdownTimer;
