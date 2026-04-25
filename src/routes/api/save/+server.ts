import { json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'db.json');

// Initialize data file if it doesn't exist
async function ensureDataFile() {
	try {
		await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
		try {
			await fs.access(DATA_FILE);
		} catch {
			await fs.writeFile(DATA_FILE, JSON.stringify({ campaigns: [], characters: [] }, null, 2));
		}
	} catch (e) {
		console.error('Failed to initialize data file', e);
	}
}

export async function GET() {
	await ensureDataFile();
	try {
		const data = await fs.readFile(DATA_FILE, 'utf-8');
		return json(JSON.parse(data));
	} catch (e) {
		console.error('Error reading data', e);
		return json({ campaigns: [], characters: [] });
	}
}

export async function POST({ request }) {
	await ensureDataFile();
	try {
		const body = await request.json();
		await fs.writeFile(DATA_FILE, JSON.stringify(body, null, 2));
		return json({ success: true });
	} catch (e) {
		console.error('Error saving data', e);
		return json({ success: false, error: e.message }, { status: 500 });
	}
}
