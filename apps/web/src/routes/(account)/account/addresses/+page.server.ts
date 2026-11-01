import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) return { addresses: [] };

	const { data: addresses, error } = await locals.supabase
		.from('addresses')
		.select('*')
		.eq('user_id', user.id)
		.order('is_default', { ascending: false });

	if (error) {
		console.error('Error fetching addresses:', error);
	}

	return {
		addresses: addresses ?? []
	};
};

export const actions: Actions = {
	addAddress: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Unauthorized' });

		const formData = await request.formData();
		const line1 = (formData.get('line1') as string)?.trim();
		const line2 = (formData.get('line2') as string)?.trim() || null;
		const city = (formData.get('city') as string)?.trim();
		const state = (formData.get('state') as string)?.trim() || null;
		const postalCode = (formData.get('postalCode') as string)?.trim();
		const country = (formData.get('country') as string)?.trim() || 'US';
		const label = (formData.get('label') as string)?.trim() || 'Home';
		const isDefault = formData.get('isDefault') === 'on';

		if (!line1 || !city || !postalCode) {
			return fail(400, { message: 'Street line 1, City, and Postal Code are required' });
		}

		if (isDefault) {
			// Unset other defaults
			await locals.supabase
				.from('addresses')
				.update({ is_default: false })
				.eq('user_id', user.id);
		}

		const { error: insertError } = await locals.supabase.from('addresses').insert({
			user_id: user.id,
			line1,
			line2,
			city,
			state,
			postal_code: postalCode,
			country,
			label,
			is_default: isDefault
		});

		if (insertError) {
			return fail(500, { message: insertError.message || 'Failed to add address' });
		}

		return { success: true, message: 'Address saved successfully!' };
	},

	setDefault: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Unauthorized' });

		const formData = await request.formData();
		const addressId = formData.get('addressId') as string;

		if (!addressId) return fail(400, { message: 'Address ID required' });

		// 1. Unset all defaults
		await locals.supabase
			.from('addresses')
			.update({ is_default: false })
			.eq('user_id', user.id);

		// 2. Set this one as default
		const { error } = await locals.supabase
			.from('addresses')
			.update({ is_default: true })
			.eq('id', addressId)
			.eq('user_id', user.id);

		if (error) {
			return fail(500, { message: error.message || 'Failed to set default' });
		}

		return { success: true, message: 'Default address updated' };
	},

	deleteAddress: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Unauthorized' });

		const formData = await request.formData();
		const addressId = formData.get('addressId') as string;

		if (!addressId) return fail(400, { message: 'Address ID required' });

		const { error } = await locals.supabase
			.from('addresses')
			.delete()
			.eq('id', addressId)
			.eq('user_id', user.id);

		if (error) {
			return fail(500, { message: error.message || 'Failed to delete address' });
		}

		return { success: true, message: 'Address deleted' };
	},

	updateAddress: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Unauthorized' });

		const formData = await request.formData();
		const addressId = formData.get('addressId') as string;
		const line1 = (formData.get('line1') as string)?.trim();
		const line2 = (formData.get('line2') as string)?.trim() || null;
		const city = (formData.get('city') as string)?.trim();
		const state = (formData.get('state') as string)?.trim() || null;
		const postalCode = (formData.get('postalCode') as string)?.trim();
		const country = (formData.get('country') as string)?.trim() || 'US';
		const label = (formData.get('label') as string)?.trim() || 'Home';
		const isDefault = formData.get('isDefault') === 'on';

		if (!addressId) {
			return fail(400, { message: 'Address ID is required' });
		}

		if (!line1 || !city || !postalCode) {
			return fail(400, { message: 'Street line 1, City, and Postal Code are required' });
		}

		if (isDefault) {
			await locals.supabase
				.from('addresses')
				.update({ is_default: false })
				.eq('user_id', user.id);
		}

		const { error: updateError } = await locals.supabase
			.from('addresses')
			.update({
				line1,
				line2,
				city,
				state,
				postal_code: postalCode,
				country,
				label,
				is_default: isDefault
			})
			.eq('id', addressId)
			.eq('user_id', user.id);

		if (updateError) {
			return fail(500, { message: updateError.message || 'Failed to update address' });
		}

		return { success: true, message: 'Address updated successfully!' };
	}
};
