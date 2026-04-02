import PostProblemClient from "./PostProblemClient";

export const metadata = {
  title: 'Post a Problem — SolvingHub',
  description: 'Share a real-world problem with the community. Describe the issue, its impacts, and challenges to get community input and solutions.',
};

export default function PostPage() {
  return <PostProblemClient />;
}