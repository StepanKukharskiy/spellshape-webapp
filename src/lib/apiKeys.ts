import PocketBase from 'pocketbase';
import { DB_URL } from '$env/static/private';

const pb = new PocketBase(DB_URL);

// Returns the newest active key for the user, or null
export async function getActiveUserApiKey(userId: string): Promise<string|null> {
  const keys = await pb.collection('api_keys').getList(1, 1, {
    filter: `user="${userId}" && is_active=true && name="spellshape-web-app"`,
    sort: '-created'
  });
  if (keys?.items?.length) return keys.items[0].key as string;
  return null;
}