import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Parallel fetch orders, products, categories, and customer profiles
	const [ordersRes, productsRes, categoriesRes, profilesRes] = await Promise.all([
		locals.supabase
			.from('orders')
			.select(
				`
				id,
				total,
				status,
				payment_status,
				created_at,
				profiles (
					id,
					full_name,
					phone
				)
			`
			)
			.order('created_at', { ascending: false }),
		locals.supabase.from('products').select('id, name, is_active, stock_quantity, price'),
		locals.supabase.from('categories').select('id, name, slug'),
		locals.supabase
			.from('profiles')
			.select('id, full_name, phone, created_at')
			.eq('role', 'customer')
	]);

	const orders = ordersRes.data ?? [];
	const products = productsRes.data ?? [];
	const categories = categoriesRes.data ?? [];
	const customers = profilesRes.data ?? [];

	// Filter non-cancelled orders for financial metrics
	const validOrders = orders.filter((o) => o.status !== 'cancelled');

	// Total Revenue
	const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
	const totalSales = validOrders.length;

	// Active Products vs Total Products
	const activeProducts = products.filter((p) => p.is_active).length;
	const totalProducts = products.length;
	const lowStockCount = products.filter((p) => p.stock_quantity <= 10).length;

	// Total Customers
	const activeUsers = customers.length;

	// Reference date: latest order's date or current date
	const now = new Date();
	const referenceDate =
		orders.length > 0 && orders[0].created_at ? new Date(orders[0].created_at) : now;
	const currentYear = referenceDate.getFullYear();
	const currentMonth = referenceDate.getMonth(); // 0-indexed

	// Month boundaries
	const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
	const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

	let currentMonthRevenue = 0;
	let prevMonthRevenue = 0;
	let currentMonthSales = 0;
	let prevMonthSales = 0;

	// 12-month revenue aggregation for the current reference year
	const monthNames = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec'
	];
	const monthlyRevenueMap = monthNames.map((name) => ({
		month: name,
		revenue: 0,
		orders: 0
	}));

	for (const order of validOrders) {
		if (!order.created_at) continue;
		const d = new Date(order.created_at);
		const year = d.getFullYear();
		const month = d.getMonth();
		const total = Number(order.total || 0);

		// Current & Previous month stats
		if (year === currentYear && month === currentMonth) {
			currentMonthRevenue += total;
			currentMonthSales += 1;
		} else if (year === prevMonthYear && month === prevMonth) {
			prevMonthRevenue += total;
			prevMonthSales += 1;
		}

		// Monthly chart data (for current year)
		if (year === currentYear) {
			monthlyRevenueMap[month].revenue =
				Math.round((monthlyRevenueMap[month].revenue + total) * 100) / 100;
			monthlyRevenueMap[month].orders += 1;
		}
	}

	// Growth percentage calculations
	const revenueGrowth =
		prevMonthRevenue > 0
			? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
			: currentMonthRevenue > 0
				? 100
				: 0;

	const salesGrowth =
		prevMonthSales > 0
			? ((currentMonthSales - prevMonthSales) / prevMonthSales) * 100
			: currentMonthSales > 0
				? 100
				: 0;

	// Max revenue for chart scaling (at least 100 to avoid division by 0)
	const maxMonthlyRevenue = Math.max(...monthlyRevenueMap.map((m) => m.revenue), 100);

	// Find the peak month
	let peakMonth = monthlyRevenueMap[0];
	for (const m of monthlyRevenueMap) {
		if (m.revenue > peakMonth.revenue) {
			peakMonth = m;
		}
	}

	// Recent sales (latest 5 orders)
	const recentSales = orders.slice(0, 5).map((order) => {
		const profile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
		const name = profile?.full_name?.trim() || 'Guest Customer';
		const words = name.split(/\s+/).filter(Boolean);
		const initials =
			words.length >= 2
				? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
				: name.slice(0, 2).toUpperCase();

		return {
			id: order.id,
			customerName: name,
			customerPhone: profile?.phone || 'No phone recorded',
			initials,
			total: Number(order.total || 0),
			status: order.status,
			paymentStatus: order.payment_status,
			createdAt: order.created_at
		};
	});

	// Order status breakdown
	const statusBreakdown = {
		delivered: orders.filter((o) => o.status === 'delivered').length,
		paid: orders.filter((o) => o.status === 'paid').length,
		shipped: orders.filter((o) => o.status === 'shipped').length,
		pending: orders.filter((o) => o.status === 'pending').length,
		cancelled: orders.filter((o) => o.status === 'cancelled').length
	};

	return {
		stats: {
			totalRevenue,
			revenueGrowth: Math.round(revenueGrowth * 10) / 10,
			totalSales,
			salesGrowth: Math.round(salesGrowth * 10) / 10,
			currentMonthSales,
			currentMonthRevenue: Math.round(currentMonthRevenue * 100) / 100,
			activeProducts,
			totalProducts,
			lowStockCount,
			activeUsers,
			currentYear,
			peakMonthName: peakMonth.month,
			peakMonthRevenue: peakMonth.revenue
		},
		monthlyRevenue: monthlyRevenueMap,
		maxMonthlyRevenue,
		recentSales,
		statusBreakdown,
		totalOrdersCount: orders.length,
		categoriesCount: categories.length
	};
};
