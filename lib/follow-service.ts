import AsyncStorage from "@react-native-async-storage/async-storage"

// In a real app, this would be stored in a database
// For this example, we'll use AsyncStorage

interface FollowRelationship {
  followerId: string
  followingId: string
}

export async function followUser(currentUserId: string, userToFollowId: string): Promise<boolean> {
  try {
    // Get existing follows
    const followsJson = await AsyncStorage.getItem("follows")
    const follows: FollowRelationship[] = followsJson ? JSON.parse(followsJson) : []

    // Check if already following
    const alreadyFollowing = follows.some((f) => f.followerId === currentUserId && f.followingId === userToFollowId)

    if (alreadyFollowing) {
      return true
    }

    // Add new follow relationship
    follows.push({
      followerId: currentUserId,
      followingId: userToFollowId,
    })

    // Save updated follows
    await AsyncStorage.setItem("follows", JSON.stringify(follows))
    return true
  } catch (error) {
    console.error("Error following user:", error)
    return false
  }
}

export async function unfollowUser(currentUserId: string, userToUnfollowId: string): Promise<boolean> {
  try {
    // Get existing follows
    const followsJson = await AsyncStorage.getItem("follows")
    const follows: FollowRelationship[] = followsJson ? JSON.parse(followsJson) : []

    // Filter out the relationship
    const updatedFollows = follows.filter(
      (f) => !(f.followerId === currentUserId && f.followingId === userToUnfollowId),
    )

    // Save updated follows
    await AsyncStorage.setItem("follows", JSON.stringify(updatedFollows))
    return true
  } catch (error) {
    console.error("Error unfollowing user:", error)
    return false
  }
}

export async function getFollowingStatus(currentUserId: string, userId: string): Promise<boolean> {
  try {
    const followsJson = await AsyncStorage.getItem("follows")
    const follows: FollowRelationship[] = followsJson ? JSON.parse(followsJson) : []

    return follows.some((f) => f.followerId === currentUserId && f.followingId === userId)
  } catch (error) {
    console.error("Error getting following status:", error)
    return false
  }
}

export async function getFollowedUsers(currentUserId: string): Promise<string[]> {
  try {
    const followsJson = await AsyncStorage.getItem("follows")
    const follows: FollowRelationship[] = followsJson ? JSON.parse(followsJson) : []

    return follows.filter((f) => f.followerId === currentUserId).map((f) => f.followingId)
  } catch (error) {
    console.error("Error getting followed users:", error)
    return []
  }
}
