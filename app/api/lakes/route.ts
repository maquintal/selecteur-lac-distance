import { NextResponse } from 'next/server';
import lacs from '@/data/lacs.json';

export async function GET() {
	try {
		return NextResponse.json(lacs);
	} catch (error) {
		console.error('Error returning lacs data:', error);
		return NextResponse.json({ error: 'Failed to return lacs' }, { status: 500 });
	}
}