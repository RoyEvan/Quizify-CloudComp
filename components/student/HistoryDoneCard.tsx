import Quiz from "@/types/quiz";
import { Button, Card, CardHeader, Chip } from "@heroui/react";

const HistoryDoneCard = ({ item, index }: { item: Quiz; index: number }) => {
  return (
    <Card
      key={`done-${index}`}
      className="bg-neutral-950 p-2 h-fit min-h-fit rounded-md border-neutral-700 border-1"
    >
      <CardHeader className="flex gap-3 justify-between">
        <div className="flex items-center gap-2">
          <Chip radius="sm" color="success">
            {parseFloat(item.score).toFixed(2)} / 100
          </Chip>
          <h1 className="text-2xl font-bold">{item.title}</h1>
        </div>
        <a href={`student/quiz/${item._id}/detail`}>
          <Button className="rounded-md flex w-fit bg-white text-black">
            Lihat Detail
          </Button>
        </a>
      </CardHeader>
    </Card>
  );
};

export default HistoryDoneCard;
