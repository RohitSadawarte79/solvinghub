import MyProblemsClient from "./MyProblemsClient";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata = {
  title: 'My Problems — SolvingHub',
  description: 'View, edit, and manage the problems you have submitted to SolvingHub.',
};

export default function MyProblemsPage() {
  return (
    <ProtectedRoute>
      <MyProblemsClient />
    </ProtectedRoute>
  );
}