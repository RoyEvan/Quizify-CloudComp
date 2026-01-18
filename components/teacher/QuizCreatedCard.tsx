import React from "react";
import {
  Chip,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Button
} from "@heroui/react";
import {
  CalendarIcon,
  CalendarCheck,
  FileCheck,
  Users,
  LayoutList,
  Hash,
  ChevronRight,
  Trash2,
} from "lucide-react";

interface QuizCreatedCardProps {
  item: {
    _id: string;
    title: string;
    access_code: string;
    quiz_started: string;
    quiz_ended: string;
    student_attempt: number;
    student_joined: number;
    questions: number;
  };
  onDelete: (quizId: string) => void;
}

const QuizCreatedCard: React.FC<QuizCreatedCardProps> = ({
  item,
  onDelete,
}) => {
  return (
    <Card
      key={item._id}
      className="bg-neutral-950 p-2 h-fit min-h-fit rounded-md border-neutral-700 border-1"
    >
      <CardHeader className="flex gap-3 justify-between items-center">
        <h1 className="text-2xl font-bold">{item.title}</h1>
        <Chip
          color="success"
          variant="solid"
          radius="sm"
          className="bg-success-300 text-white"
          startContent={<Hash size={18} color="white" />}
        >
          <span className="font-bold">{item.access_code}</span>
        </Chip>
      </CardHeader>
      <CardBody className="flex flex-row justify-between items-end">
        <div className="flex flex-col gap-1">
          <span className="text-large flex items-center gap-2">
            <CalendarIcon />
            {new Date(item.quiz_started).toLocaleString(undefined, {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="text-large flex items-center gap-2">
            <CalendarCheck />
            {new Date(item.quiz_ended).toLocaleString(undefined, {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="text-large flex items-center gap-2">
            <FileCheck />
            {item.student_attempt} orang telah memulai quiz
          </span>
          <span className="text-large flex items-center gap-2">
            <Users />
            {item.student_joined + item.student_attempt} orang telah bergabung
          </span>
          <span className="text-large flex items-center gap-2">
            <LayoutList />
            {item.questions} soal tersedia
          </span>
        </div>
      </CardBody>
      <CardFooter className="flex gap-2 justify-end items-center">
        <Button
          onClick={() => onDelete(item._id)}
          color="danger"
          className="rounded-md flex w-fit items-center gap-0 px-2 pe-4"
          startContent={<Trash2 className="h-1/2" />}
        >
          Hapus Quiz Ini
        </Button>
        <a href={`teacher/quiz/question/add/${item._id}`}>
          <Button
            className="rounded-md flex w-fit items-center gap-0 px-2 ps-4 bg-white text-black"
            endContent={<ChevronRight className="h-1/3" />}
          >
            Lihat Detail
          </Button>
        </a>
      </CardFooter>
    </Card>
  );
};

export default QuizCreatedCard;
