export function getUserColor(userID: string): string {
  return '#' + userID.slice(0, 6);
}

export function getUserHexTag(userID: string): string {
  return userID.split('-')[3];
}
