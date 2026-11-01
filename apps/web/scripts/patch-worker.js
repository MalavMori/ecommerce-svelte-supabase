import fs from 'fs';
import path from 'path';

const workerPath = path.resolve('.svelte-kit/cloudflare/_worker.js');
if (fs.existsSync(workerPath)) {
	let code = fs.readFileSync(workerPath, 'utf-8');
	// Patch server.respond to pass platform: { env }
	if (code.includes('server.respond(req, {') && !code.includes('platform: { env')) {
		code = code.replace(
			'server.respond(req, {',
			'server.respond(req, { platform: { env },'
		);
		fs.writeFileSync(workerPath, code);
		console.log('✅ Patched _worker.js to inject platform.env');
	}
}
