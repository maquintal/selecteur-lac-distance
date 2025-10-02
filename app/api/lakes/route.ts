import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Lake } from '@/app/types/lake';

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db("peche_plan_eau");
        
        const peche_plan_eau = await db.collection<Lake>("peche_plan_eau").find({}).toArray();
        
        return NextResponse.json(peche_plan_eau);
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch peche_plan_eau' },
            { status: 500 }
        );
    }
}