import Questions from "@/types/question";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Image } from "@heroui/image";
import { Textarea } from "@heroui/input";
import { Radio, RadioGroup } from "@heroui/radio";
import { cn } from "@heroui/theme";
import { useState } from "react";

const QuestionCard = (props: Questions) => {
  const [answer, setAnswer] = useState<string>(props.answer.toString());
  const changeAnswer = (newAns: string) => {
    setAnswer(newAns);
    props.updateAnswer(newAns);
  };

  // const containsImage = props.answers?.find((ans) => {
  //   return ans.toString().startsWith("https://");
  // });

  const multipleChoiceAnswers = props.answers?.map((answer, index) => {
    let choice = "A".charCodeAt(0);
    choice += index;

    return (
      <Radio
        key={`${props.rand_seq}-answer-${index}`}
        value={`${index}`}
        classNames={{
          base: cn(
            // Normal COndition
            "pilgan-item opacity-100 m-0 px-0 bg-neutral-950 w-full items-start pe-2 max-w-full rounded-md border-1 border-neutral-700",
            "data-[selected=true]:border-primary"
          ),
        }}
      >
        <div className="flex gap-2 items-start">
          <div className="ms-1 pilgan font-bold min-w-8 min-h-8 bg-neutral-700 rounded-sm flex aspect-square h-fit w-8  justify-center items-center">
            {String.fromCharCode(choice)}
          </div>

          <div>
            {answer.toString().startsWith("https://") ? (
              <Image
                radius="sm"
                alt={String.fromCharCode(choice)}
                src={answer.toString()}
                width={1000}
              />
            ) : (
              answer
            )}
          </div>
        </div>
      </Radio>
    );
  });

  return (
    <Card
      key={`${props.rand_seq}`}
      className="flex border-neutral-700 bg-black p-4 w-full h-full overflow-auto rounded-none flex-grow"
    >
      <CardHeader className="flex gap-2 justify-between">
        {/* ISI SOAL */}
        <div className="flex gap-4 items-center">
          {/* No Soal */}
          <div className="text-2xl font-bold bg-white text-black h-fit aspect-square min-w-8 w-8 justify-center flex items-center rounded-sm">
            {props.rand_seq}
          </div>
          <h1 className="text-3xl font-bold">{props.title}</h1>
        </div>

        
      </CardHeader>
      <CardBody className="flex gap-4 min-h-max">
        {/* KALAU ADA GAMBAR */}
        {props.img && (
          <Image
            isZoomed
            radius="sm"
            src={props.img.toString()}
            alt=""
            width={320}
          />
        )}
        {props.type == "pg" ? (
          <RadioGroup
            className="radio-list-soal w-full"
            onValueChange={changeAnswer}
            defaultValue={`${props.answer}`}
          >
            {multipleChoiceAnswers}
          </RadioGroup>
        ) : props.type == "ur" ? (
          <Textarea
            radius="sm"
            className="max-w-full"
            onChange={(e) => changeAnswer(e.target.value)}
            placeholder="Jawaban Anda Disini...."
            label="Jawaban Anda"
            labelPlacement="outside"
            value={answer}
          />
        ) : (
          <p>Terjadi Error! Refresh halaman ini.</p>
        )}
      </CardBody>
    </Card>
  );
};

export default QuestionCard;
