import MyProblemsClient from "./MyProblemsClient";

export const metadata = {
  title: 'My Problems — SolvingHub',
  description: 'View, edit, and manage the problems you have submitted to SolvingHub.',
};

export default function MyProblemsPage() {
  return <MyProblemsClient />;
}