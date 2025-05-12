import { useAuth } from "@clerk/clerk-expo";

export interface ClerkUser {
  id: string
  username: string
  firstName?: string
  lastName?: string
  imageUrl: string
  isFollowing?: boolean
}

export async function searchUsers(query: string): Promise<ClerkUser[]> {
  try {
    if (!query?.trim() || query.trim().length < 2) return []

    const { getToken } = useAuth();
    const token = await getToken();
    
    const response = await fetch(`https://api.clerk.dev/v1/users?query=${encodeURIComponent(query)}&limit=10`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    const users = await response.json();

    return users.map((user: any) => ({
      id: user.id,
      username: user.username || `user_${user.id.substring(0, 5)}`,
      firstName: user.first_name,
      lastName: user.last_name,
      imageUrl: user.profile_image_url,
    }));
  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
}