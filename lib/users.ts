const CLERK_SECRET_KEY = process.env.EXPO_PUBLIC_CLERK_SECRET_KEY || ""
const CLERK_API_BASE = "https://api.clerk.com/v1"

export interface ClerkUser {
  id: string
  first_name: string
  last_name: string
  image_url: string
  username: string
  email_addresses: Array<{ email_address: string }>
}


export const searchUsers = async (query = ""): Promise<ClerkUser[]> => {
  try {
    const url = query
      ? `${CLERK_API_BASE}/users?query=${encodeURIComponent(query)}&limit=50`
      : `${CLERK_API_BASE}/users?limit=50`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch users")
    }

    const users = await response.json()
    return users.map((user: any) => ({
      id: user.id,
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      imageUrl: user.image_url || "",
      username: user.username || user.email_addresses?.[0]?.email_address?.split("@")[0] || "",
    }))
  } catch (error) {
    console.error("Error searching users:", error)
    return []
  }
}

export const followUser = async (followerId: string, followingId: string): Promise<void> => {
  try {
    const response = await fetch("/api/follow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        follower_id: followerId,
        following_id: followingId,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to follow user")
    }
  } catch (error) {
    console.error("Error following user:", error)
    throw error
  }
}

export const unfollowUser = async (followerId: string, followingId: string): Promise<void> => {
  try {
    const response = await fetch("/api/follow", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        follower_id: followerId,
        following_id: followingId,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to unfollow user")
    }
  } catch (error) {
    console.error("Error unfollowing user:", error)
    throw error
  }
}

export const getFollowStatus = async (followerId: string, followingId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/follow/status?follower_id=${followerId}&following_id=${followingId}`)

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return data.isFollowing
  } catch (error) {
    console.error("Error getting follow status:", error)
    return false
  }
}

export const getFollowingUsers = async (userId: string): Promise<ClerkUser[]> => {
  try {
    const response = await fetch(`/api/follow/following?user_id=${userId}`)

    if (!response.ok) {
      throw new Error("Failed to fetch following users")
    }

    const followingIds = await response.json()

    // Fetch user details from Clerk for each following ID
    const followingUsers = await Promise.all(
      followingIds.map(async (id: string) => {
        const userResponse = await fetch(`${CLERK_API_BASE}/users/${id}`, {
          headers: {
            Authorization: `Bearer ${CLERK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        })

        if (userResponse.ok) {
          const user = await userResponse.json()
          return {
            id: user.id,
            firstName: user.first_name || "",
            lastName: user.last_name || "",
            imageUrl: user.image_url || "",
            username: user.username || user.email_addresses?.[0]?.email_address?.split("@")[0] || "",
          }
        }
        return null
      }),
    )

    return followingUsers.filter(Boolean) as ClerkUser[]
  } catch (error) {
    console.error("Error getting following users:", error)
    return []
  }
}
