import UserProfile from "@/components/user profile/userProfile"

export const metadata = {
    title: "My Profile | SolvingHub",
    description: "View and manage your SolvingHub profile",
}

import ProtectedRoute from "@/components/auth/ProtectedRoute"

export default function ProfilePage() {
    return (
        <ProtectedRoute>
            <div className="py-8">
                <UserProfile />
            </div>
        </ProtectedRoute>
    )
}
