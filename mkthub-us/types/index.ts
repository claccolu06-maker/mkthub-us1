export type Quarter = 1 | 2;

export type MilestoneType = 'exam' | 'task';
export type ExamSubtype = 'partial' | 'final';

export interface Milestone {
  id: string;
  type: MilestoneType;
  /** Etiqueta opcional del examen; ausente en entregas y en exámenes genéricos. */
  examSubtype?: ExamSubtype;
  title: string;
  /** Fecha y hora en ISO-8601. Los hitos se crean con la hora local de quien los añade. */
  date: string;
  /** Vacío mientras no se haya anunciado el aula. */
  classroom: string;
  votes: number;
}

export type ClassTipKind = 'notice' | 'clarification' | 'heard-in-class';

export interface ClassTip {
  id: string;
  user: string;
  text: string;
  /** Opcional para que los apuntes antiguos sigan leyéndose sin inventar una categoría. */
  kind?: ClassTipKind;
  /** Fecha de creación en ISO-8601. */
  date: string;
}

export interface Comment {
  id: string;
  user: string;
  text: string;
  /** Fecha de creación en ISO-8601. */
  date: string;
}

export interface Course {
  id: string;
  title: string;
  code: string;
  quarters: Quarter[];
  borderColor: string;
  badgeBg: string;
  events: Milestone[];
  tips: ClassTip[];
  comments: Comment[];
}
