import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const ALLOWED_BUCKETS = ['files', 'product-images'] as const;
type AllowedBucket = (typeof ALLOWED_BUCKETS)[number];

function getBucket(raw?: string | null): AllowedBucket {
	if (raw && (ALLOWED_BUCKETS as readonly string[]).includes(raw)) {
		return raw as AllowedBucket;
	}
	return 'files';
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	const bucket = getBucket(formData.get('bucket')?.toString());
	const folder = (formData.get('folder')?.toString() || '').replace(/^\/+|\/+$/g, '');

	if (!file || !(file instanceof File) || file.size === 0) {
		return json({ success: false, error: 'No valid file provided' }, { status: 400 });
	}

	// Max 20MB limit
	if (file.size > 20 * 1024 * 1024) {
		return json({ success: false, error: 'File exceeds 20MB size limit' }, { status: 400 });
	}

	const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
	const uniqueId = crypto.randomUUID();
	const storagePath = folder ? `${folder}/${uniqueId}.${ext}` : `${uniqueId}.${ext}`;

	const arrayBuffer = await file.arrayBuffer();
	const { error: uploadError } = await locals.supabase.storage
		.from(bucket)
		.upload(storagePath, arrayBuffer, {
			contentType: file.type || 'application/octet-stream',
			upsert: false
		});

	if (uploadError) {
		return json({ success: false, error: uploadError.message }, { status: 500 });
	}

	const { data: publicData } = locals.supabase.storage.from(bucket).getPublicUrl(storagePath);

	return json({
		success: true,
		url: publicData.publicUrl,
		path: storagePath,
		name: file.name,
		size: file.size,
		type: file.type,
		bucket
	});
};

export const GET: RequestHandler = async ({ url, locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const bucket = getBucket(url.searchParams.get('bucket'));
	const folder = (url.searchParams.get('folder') || '').replace(/^\/+|\/+$/g, '');

	/** Recursively collect real files from a given prefix (one level deep for subfolders). */
	async function listFiles(prefix: string): Promise<ReturnType<typeof buildEntry>[]> {
		const { data, error: listError } = await locals.supabase.storage
			.from(bucket)
			.list(prefix, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });

		if (listError || !data) return [];

		const results: ReturnType<typeof buildEntry>[] = [];

		for (const f of data) {
			if (!f.name || f.name.startsWith('.')) continue;

			if (f.metadata === null || f.id === null) {
				// This is a folder placeholder — recurse into it (one level)
				const subPrefix = prefix ? `${prefix}/${f.name}` : f.name;
				const subFiles = await listFiles(subPrefix);
				results.push(...subFiles);
			} else {
				results.push(buildEntry(f, prefix));
			}
		}

		return results;
	}

	function buildEntry(
		f: { name: string; id: string | null; created_at: string | null; metadata?: Record<string, unknown> | null },
		prefix: string
	) {
		const fullPath = prefix ? `${prefix}/${f.name}` : f.name;
		const { data } = locals.supabase.storage.from(bucket).getPublicUrl(fullPath);
		return {
			name: f.name,
			id: f.id,
			size: (f.metadata?.size as number) ?? 0,
			mimetype: (f.metadata?.mimetype as string) ?? '',
			createdAt: f.created_at,
			path: fullPath,
			url: data.publicUrl,
			bucket
		};
	}

	const result = await listFiles(folder);

	return json({
		success: true,
		bucket,
		files: result
	});
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const body = await request.json();
	const bucket = getBucket(body?.bucket);
	const path = body?.path;
	if (!path || typeof path !== 'string') {
		return json({ success: false, error: 'Path is required' }, { status: 400 });
	}

	const { error: deleteError } = await locals.supabase.storage.from(bucket).remove([path]);
	if (deleteError) {
		return json({ success: false, error: deleteError.message }, { status: 500 });
	}

	return json({ success: true });
};

