import { z } from "zod";

export const questionSchema = z.object({
  question_text: z.string().min(1, "Question text is required"),
  answers: z
    .record(z.string(), z.boolean())
    .refine(
      (answers) => Object.keys(answers).length >= 2,
      "At least 2 answers are required"
    )
    .refine(
      (answers) => Object.values(answers).filter(Boolean).length === 1,
      "Exactly one answer must be correct"
    ),
});

export type Question = z.infer<typeof questionSchema>;

export type QuestionWithId = Question & {
  id: string;
};

export type Answer = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export const playerNameSchema = z.object({
  playerName: z
    .string()
    .min(1, "Name is required")
    .max(20, "Name must be at most 20 characters long"),
});

export type PlayerName = z.infer<typeof playerNameSchema>;
export type Player = {
  id: string;
  name: string;
  position: number;
  color: string;
};


export type Coordinates = {
  row: number;
  col: number;
}

export type SnakeData = {
  type: "snake";
  id: string;
  head: number;
  tail: number;
  coordinates: {
    from: Coordinates;
    to: Coordinates;
  };
  color: string;
  description: string;
}

export type LadderData = {
  type: "ladder";
  id: string;
  bottom: number;
  top: number;
  coordinates: {
    from: Coordinates;
    to: Coordinates;
  };
  color: string;
  description: string;
}

export type GamePlayer = {
  id: string;
  name: string;
  position: number;
  coordinates: Coordinates;
  isCurrentPlayer: boolean;
  color: string;
}

export type GameArea = {
  board: {
    size: number;
    grid: {
      rows: number;
      columns: number;
    };
  };
  elements: {
    snakes: SnakeData[];
    ladders: LadderData[];
  };
  players: GamePlayer[];
  boardNumbers: { [key: number]: Coordinates };
}