import * as SecureStore from "expo-secure-store";

const accessTokenKey = "table-tennis-mobile-access-token";

export async function saveAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(accessTokenKey, token);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(accessTokenKey);
}

export async function clearAccessToken(): Promise<void> {
  await SecureStore.deleteItemAsync(accessTokenKey);
}
