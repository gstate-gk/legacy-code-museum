export interface SlimComment {
  id: string;
  t: string;       // text
  f: string;       // file_path
  ln: number;      // line_number
  ri: string;      // repo_id
  rn: string;      // repo_name
  l: string;       // language
  tg: string[];    // tags
  pe: string;      // primary_emotion
  ei: number;      // emotion_intensity
  jp: boolean;     // is_japanese
  y: number;       // year
  is: number;      // interesting_score
}

export interface CommentsIndex {
  total: number;
  chunks: number;
  chunk_size: number;
  repos: string[];
  languages: string[];
  tags: string[];
}

export interface FullComment {
  id: string;
  text: string;
  file_path: string;
  line_number: number;
  repo_id: string;
  repo_name: string;
  language: string;
  tags: string[];
  emotions: Record<string, number>;
  primary_emotion: string;
  emotion_intensity: number;
  is_japanese: boolean;
  year: number;
  interesting_score: number;
}

export interface Antique {
  id: string;
  text: string;
  file_path: string;
  line_number: number;
  repo_id: string;
  repo_name: string;
  language: string;
  year: number;
  tags: string[];
  interesting_score: number;
  ai_analysis: {
    primary_emotion: string;
    emotion_intensity: number;
    emotions: Record<string, number>;
    interpretation: string;
  };
  appraiser_note: string;
}

export interface LanguageEmotion {
  language: string;
  total_comments: number;
  japanese_comments: number;
  emotions: Record<string, {
    count: number;
    percentage: number;
    avg_intensity: number;
  }>;
  tags: Record<string, number>;
  top_emotions: string[];
}

export type LanguageEmotions = Record<string, LanguageEmotion>;
