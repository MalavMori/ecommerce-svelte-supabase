export interface CategoryNode {
	id: string;
	name: string;
	slug: string;
	parent_id?: string | null;
}

/**
 * Returns an array containing the rootId and all descendant (children, grandchildren, etc.) category IDs.
 */
export function getCategoryAndDescendantIds(
	rootId: string,
	categories: CategoryNode[]
): string[] {
	const ids = new Set<string>([rootId]);
	const queue = [rootId];

	while (queue.length > 0) {
		const currentId = queue.shift()!;
		for (const cat of categories) {
			if (cat.parent_id === currentId && !ids.has(cat.id)) {
				ids.add(cat.id);
				queue.push(cat.id);
			}
		}
	}

	return Array.from(ids);
}

/**
 * Returns the ancestor hierarchy for a given category (from top-level ancestor down to immediate parent).
 */
export function getCategoryAncestors(
	currentCategory: CategoryNode,
	categories: CategoryNode[]
): CategoryNode[] {
	const ancestors: CategoryNode[] = [];
	let currentParentId = currentCategory.parent_id;
	const visited = new Set<string>([currentCategory.id]);

	while (currentParentId) {
		if (visited.has(currentParentId)) break;
		visited.add(currentParentId);

		const parent = categories.find((c) => c.id === currentParentId);
		if (parent) {
			ancestors.unshift(parent);
			currentParentId = parent.parent_id;
		} else {
			break;
		}
	}

	return ancestors;
}

/**
 * Returns immediate subcategories (children) of a given category.
 */
export function getSubcategories(
	parentId: string,
	categories: CategoryNode[]
): CategoryNode[] {
	return categories.filter((c) => c.parent_id === parentId);
}
