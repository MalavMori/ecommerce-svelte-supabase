import type { Database } from '@repo/supabase-client/types';
import type { SupabaseClient } from '@supabase/supabase-js';

declare const supabase: SupabaseClient<Database>;

async function test() {
	const { data, error } = await supabase.from('categories').select('*');
	// What is `data` inferred as?
	data?.map(c => c.name);
}
