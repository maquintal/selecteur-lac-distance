import { NextResponse } from 'next/server';
import lacs from '@/data/lacs.json';
import { Lake } from '@/app/types/lake';

export async function GET() {
	try {
		const typedLacs = (Array.isArray(lacs) ? lacs : []) as unknown as Array<Partial<Lake>>;
		const totalLacs = typedLacs.length;

		const lacsAvecHebergement = typedLacs.filter((l) => Array.isArray(l.hebergement) && l.hebergement.length > 0).length;

		const lacsMoteurElectrique = typedLacs.filter((l) => l.embarcation?.motorisation?.necessaire === 'electrique').length;
		const lacsMoteurEssence = typedLacs.filter((l) => l.embarcation?.motorisation?.necessaire === 'essence').length;
		const lacsSansMotorisation = totalLacs - (lacsMoteurElectrique + lacsMoteurEssence);

		const regionCounts = new Map<string, number>();
		for (const lac of typedLacs) {
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