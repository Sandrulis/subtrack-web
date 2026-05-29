export type SuggestionRow = {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: string;
  voteCount: number;
  viewerVoted: boolean;
  authorDisplay: string;
  isOwn: boolean;
};
