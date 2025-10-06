import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Lake } from '@/app/types/lake';

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db("peche_plan_eau");

        const peche_plan_eau = await db.collection<Lake>("peche_plan_eau")
            .aggregate([
                {
                    $addFields: {
                        hebergementCount: {
                            $cond: {
                                if: { $isArray: "$hebergement" },
                                then: { $size: "$hebergement" },
                                else: 0
                            }
                        }
                    }
                },
                {
                    $sort: { hebergementCount: -1 }
                },
                {
                    $project: {
                        hebergementCount: 0  // Optionnel : retire le champ temporaire
                    }
                }
            ])
            .toArray();

        return NextResponse.json(peche_plan_eau);
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch peche_plan_eau' },
            { status: 500 }
        );
    }
}