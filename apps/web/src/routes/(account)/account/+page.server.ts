import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

const AVATARS_BUCKET = 'avatars';
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

function getAvatarStoragePath(avatarUrl: string | null): string | null {
	if (!avatarUrl) return null;
	try {
		const url = new URL(avatarUrl);
		const match = url.pathname.match(/\/object\/public\/avatars\/(.+)/);
		return match ? decodeURIComponent(match[1]) : null;
	} catch {
		return null;
	}
}

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) return { profile: null };

	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('*')
		.eq('id', user.id)
		.single();

	return {
		profile,
		email: user.email
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const fullName = (formData.get('fullName') as string)?.trim() || null;
		const phone = (formData.get('phone') as string)?.trim() || null;
		const avatarFile = formData.get('avatarFile') as File | null;
		const removeAvatar = formData.get('removeAvatar') === 'true';

		// Fetch current profile to check existing avatar
		const { data: currentProfile } = await locals.supabase
			.from('profiles')
			.select('avatar_url')
			.eq('id', user.id)
			.single();

		let avatarUrl = currentProfile?.avatar_url ?? null;

		if (removeAvatar) {
			// Explicit avatar deletion requested
			if (currentProfile?.avatar_url) {
				const oldPath = getAvatarStoragePath(currentProfile.avatar_url);
				if (oldPath) {
					await locals.supabase.storage.from(AVATARS_BUCKET).remove([oldPath]);
				}
			}
			avatarUrl = null;
		} else if (avatarFile && avatarFile.size > 0 && avatarFile.name) {
			// Validate file type
			if (!ALLOWED_MIME_TYPES.includes(avatarFile.type)) {
				return fail(400, {
					message: 'Invalid image format. Allowed formats: JPEG, PNG, WebP, GIF, AVIF'
				});
			}

			// Validate file size
			if (avatarFile.size > MAX_AVATAR_SIZE) {
				return fail(400, {
					message: 'Image size exceeds 5MB limit. Please upload a smaller file.'
				});
			}

			const ext = avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg';
			const storagePath = `${user.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
			const arrayBuffer = await avatarFile.arrayBuffer();

			const { error: uploadError } = await locals.supabase.storage
				.from(AVATARS_BUCKET)
				.upload(storagePath, arrayBuffer, {
					contentType: avatarFile.type,
					upsert: true
				});

			if (uploadError) {
				return fail(500, { message: `Avatar upload failed: ${uploadError.message}` });
			}

			// Delete previous avatar file from storage if one existed
			if (currentProfile?.avatar_url) {
				const oldPath = getAvatarStoragePath(currentProfile.avatar_url);
				if (oldPath && oldPath !== storagePath) {
					await locals.supabase.storage.from(AVATARS_BUCKET).remove([oldPath]);
				}
			}

			const { data: urlData } = locals.supabase.storage
				.from(AVATARS_BUCKET)
				.getPublicUrl(storagePath);

			avatarUrl = urlData.publicUrl;
		}

		const { error: updateError } = await locals.supabase
			.from('profiles')
			.update({
				full_name: fullName,
				phone,
				avatar_url: avatarUrl
			})
			.eq('id', user.id);

		if (updateError) {
			return fail(500, { message: updateError.message || 'Failed to update profile' });
		}

		return { success: true, message: 'Profile updated successfully!' };
	},

	deleteAvatar: async ({ locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const { data: currentProfile } = await locals.supabase
			.from('profiles')
			.select('avatar_url')
			.eq('id', user.id)
			.single();

		if (currentProfile?.avatar_url) {
			const oldPath = getAvatarStoragePath(currentProfile.avatar_url);
			if (oldPath) {
				await locals.supabase.storage.from(AVATARS_BUCKET).remove([oldPath]);
			}
		}

		const { error: updateError } = await locals.supabase
			.from('profiles')
			.update({ avatar_url: null })
			.eq('id', user.id);

		if (updateError) {
			return fail(500, { message: updateError.message || 'Failed to remove avatar' });
		}

		return { success: true, message: 'Avatar removed successfully!' };
	}
};
