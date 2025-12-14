import { NextResponse } from 'next/server';
import lacs from '@/data/lacs.json';

function safeGet(obj: any, path: string[]) {
	return path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

export async function GET() {
	try {
		const totalLacs = Array.isArray(lacs) ? lacs.length : 0;

		const lacsAvecHebergement = lacs.filter((l: any) => Array.isArray(l.hebergement) && l.hebergement.length > 0).length;

		const lacsMoteurElectrique = lacs.filter((l: any) => safeGet(l, ['embarcation', 'motorisation', 'type']) === 'electrique').length;
		const lacsMoteurEssence = lacs.filter((l: any) => safeGet(l, ['embarcation', 'motorisation', 'type']) === 'essence').length;
		const lacsSansMotorisation = totalLacs - (lacsMoteurElectrique + lacsMoteurEssence);

		const regionCounts = new Map<string, number>();
		for (const lac of lacs) {
			const region = lac.regionAdministrativeQuebec || 'Non spécifié';
			regionCounts.set(region, (regionCounts.get(region) || 0) + 1);
		}

		const parRegion = Array.from(regionCounts.entries())
			.map(([region, nombreLacs]) => ({
				region,
				nombreLacs,
				pourcentage: totalLacs ? Math.round((nombreLacs / totalLacs) * 10000) / 100 : 0,
			}))
			.sort((a, b) => b.nombreLacs - a.nombreLacs);

		const stats = {
			global: {
				totalLacs,
				lacsAvecHebergement,
				lacsMoteurElectrique,
				lacsMoteurEssence,
				lacsSansMotorisation,
			},
			parRegion,
		};

		return NextResponse.json(stats);
	} catch (error) {
		console.error('Error computing lakes stats:', error);
		return NextResponse.json({ error: 'Failed to compute statistics' }, { status: 500 });
	}
}