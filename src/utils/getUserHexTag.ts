export function getUserHexTag(userID: string): string {
  return userID.split('-')[3];
}
